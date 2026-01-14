const Database = require('better-sqlite3');
const CatLoggr = require('cat-loggr');
const readline = require('readline');

// Create custom CatLoggr with database operation categories
const dbLog = new CatLoggr().setLevels([
    { name: 'open', color: CatLoggr._chalk.bold.bgBlue.white },
    { name: 'close', color: CatLoggr._chalk.bold.bgCyan.white },
    { name: 'create', color: CatLoggr._chalk.bold.bgGreen.white },
    { name: 'insert', color: CatLoggr._chalk.bold.bgMagenta.white },
    { name: 'select', color: CatLoggr._chalk.bold.bgWhite.black },
    { name: 'update', color: CatLoggr._chalk.bold.bgYellow.black },
    { name: 'delete', color: CatLoggr._chalk.bold.bgRed.white },
    { name: 'drop', color: CatLoggr._chalk.bold.bgRedBright.white },
    { name: 'backup', color: CatLoggr._chalk.bold.bgCyanBright.white },
    { name: 'schema', color: CatLoggr._chalk.bold.bgBlackBright.white },
    { name: 'warn', color: CatLoggr._chalk.bold.bgYellow.black },
    { name: 'error', color: CatLoggr._chalk.bold.bgRed.white },
    { name: 'cancel', color: CatLoggr._chalk.bold.bgBlackBright.white },
    { name: 'debug', color: CatLoggr._chalk.bold.bgBlackBright.white },
]).setLevel('debug');

// Helper function to format values for SQL display
function formatSqlValue(value) {
    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? '1' : '0';
    return value;
}

// Helper function to prompt user for confirmation
function confirmAction(message) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(`⚠️  ${message} (y/n): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}
const printTable = console.table.bind(console);

function loadDatabase(name) {
    const sqlDB = new Database(name);
    dbLog.open(`Opened database: ${name}`);
    
    const instance = {
        sqlDB,
        dbName: name,
        
        deleteTable(table, { dryRun = false } = {}) {
            const query = `DROP TABLE IF EXISTS ${table};`;
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return this;
            }
            this.sqlDB.exec(query);
            dbLog.drop(`Dropped table: ${table}`);
            return this;
        },
        
        createTable(table, columns, { dryRun = false } = {}) {
            const columnDefs = columns.map(({ name, type }) => `    ${name} ${type}`).join(',\n');
            const query = `CREATE TABLE IF NOT EXISTS ${table} (\n${columnDefs}\n);`;
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return this;
            }
            this.sqlDB.exec(query);
            dbLog.create(`Created table: ${table} (${columns.map(c => c.name).join(', ')})`);
            return this;
        },
        
        tableExists(table, { dryRun = false } = {}) {
            const query = `SELECT 1 FROM sqlite_master WHERE type='table' AND name='${table}';`;
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return null;
            }
            const result = this.sqlDB.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`).get(table);
            return result !== undefined;
        },
        
        getData(table, get = "*", options = {}) {
            if (typeof get === 'object' && get !== null) {
                options = get;
                get = "*";
            }
            
            let query = `SELECT ${get} FROM ${table}`;
            if (options.where) query += `\nWHERE ${options.where}`;
            if (options.orderBy) query += `\nORDER BY ${options.orderBy}`;
            if (options.limit) query += `\nLIMIT ${options.limit}`;
            query += ';';
            
            if (options.dryRun) {
                dbLog.debug(`\n${query}`);
                return [];
            }
            
            const results = this.sqlDB.prepare(query).all()
            if (!options.silent) dbLog.select(`${results.length} rows from "${table}"`);
            return results;
        },
        
        insertData(table, data, { dryRun = false } = {}) {
            const now = new Date().getTime();
            if (typeof data !== 'object' || Array.isArray(data)) {
                dbLog.error(`Insert failed: invalid data type for "${table}"`);
                throw new Error('Data must be an object');
            }
            const keys = Object.keys(data);
            const values = Object.values(data);
            const formattedValues = values.map(formatSqlValue).join(', ');
            const query = `INSERT INTO ${table} (${keys.join(', ')})\nVALUES (${formattedValues});`;
            
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return this;
            }
            
            const placeholders = keys.map(() => '?').join(', ');
            const execQuery = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
            this.sqlDB.prepare(execQuery).run(values);
            const now2 = new Date().getTime();
            dbLog.insert(`INTO "${table}": ${JSON.stringify(data)}, Took ${now2 - now}ms`);
            return this;
        },
        
        insertMany(table, dataArray, { dryRun = false } = {}) {
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                throw new Error('Data must be a non-empty array');
            }
            const keys = Object.keys(dataArray[0]);
            
            if (dryRun) {
                const sampleRows = dataArray.slice(0, 3);
                const valueRows = sampleRows.map(row => {
                    const formattedValues = Object.values(row).map(formatSqlValue).join(', ');
                    return `    (${formattedValues})`;
                });
                const moreRows = dataArray.length > 3 ? `\n    -- ... and ${dataArray.length - 3} more rows` : '';
                const query = `INSERT INTO ${table} (${keys.join(', ')})\nVALUES\n${valueRows.join(',\n')}${moreRows};`;
                dbLog.debug(`\n${query}`);
                return this;
            }
            
            const placeholders = keys.map(() => '?').join(', ');
            const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
            const stmt = this.sqlDB.prepare(query);
            const insertAll = this.sqlDB.transaction((rows) => {
                for (const row of rows) stmt.run(Object.values(row));
            });
            insertAll(dataArray);
            dbLog.insert(`${dataArray.length} rows into "${table}"`);
            return this;
        },
        
        async deleteData(table, where, { dryRun = false, force = false } = {}) {
            if (!where) {
                dbLog.error(`Delete failed: WHERE clause required for "${table}"`);
                throw new Error('Where clause is required for deletion');
            }
            const query = `DELETE FROM ${table}\nWHERE ${where};`;
            
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return this;
            }
            
            // Preview data to be deleted
            const previewQuery = `SELECT * FROM ${table} WHERE ${where}`;
            const rowsToDelete = this.sqlDB.prepare(previewQuery).all();
            
            if (rowsToDelete.length === 0) {
                dbLog.warn(`No rows match the condition: ${where}`);
                return this;
            }
            
            dbLog.warn(`The following ${rowsToDelete.length} row(s) will be DELETED from "${table}":`);
            printTable(rowsToDelete.slice(0, 10));
            if (rowsToDelete.length > 10) {
                dbLog.warn(`... and ${rowsToDelete.length - 10} more rows`);
            }
            
            if (!force) {
                const confirmed = await confirmAction(`Are you sure you want to delete ${rowsToDelete.length} row(s)?`);
                if (!confirmed) {
                    dbLog.cancel(`Delete cancelled by user`);
                    return this;
                }
            }
            
            const result = this.sqlDB.prepare(query).run();
            dbLog.delete(`${result.changes} rows from "${table}" WHERE ${where}`);
            return this;
        },
        
        listTables({ dryRun = false } = {}) {
            const query = `SELECT name\nFROM sqlite_master\nWHERE type='table'\n  AND name NOT LIKE 'sqlite_%';`;
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return [];
            }
            const tables = this.sqlDB.prepare(query).all().map(r => r.name);
            dbLog.schema(`Tables: [${tables.join(', ')}]`);
            return tables;
        },
        
        getTableSchema(table, { dryRun = false } = {}) {
            const query = `PRAGMA table_info(${table});`;
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return [];
            }
            const rows = this.sqlDB.prepare(query).all();
            return rows.map(({ name, type }) => ({ name, type: type || 'TEXT' }));
        },
        
        updateData(table, data, where, { dryRun = false } = {}) {
            if (typeof data !== 'object' || Array.isArray(data)) {
                dbLog.error(`Update failed: invalid data type for "${table}"`);
                throw new Error('Data must be an object');
            }
            const updates = Object.entries(data)
                .map(([key, value]) => `    ${key} = ${formatSqlValue(value)}`)
                .join(',\n');
            const query = `UPDATE ${table}\nSET\n${updates}\nWHERE ${where};`;
            
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return this;
            }
            const updateClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const execQuery = `UPDATE ${table} SET ${updateClause} WHERE ${where}`;
            const values = Object.values(data);
            const result = this.sqlDB.prepare(execQuery).run(values);
            dbLog.update(`${result.changes} rows in "${table}" WHERE ${where}`);
            return this;
        },
        
        async dropTable(table, { dryRun = false, force = false } = {}) {
            const query = `DROP TABLE IF EXISTS ${table};`;
            
            if (dryRun) {
                dbLog.debug(`\n${query}`);
                return this;
            }
            
            // Check if table exists and get row count
            const exists = this.tableExists(table);
            if (!exists) {
                dbLog.warn(`Table "${table}" does not exist`);
                return this;
            }
            
            // Preview table data
            const rowCount = this.sqlDB.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
            const schema = this.getTableSchema(table);
            const sampleData = this.sqlDB.prepare(`SELECT * FROM ${table} LIMIT 5`).all();
            
            dbLog.warn(`TABLE "${table}" WILL BE PERMANENTLY DELETED!`);
            dbLog.warn(`Columns: ${schema.map(c => `${c.name} (${c.type})`).join(', ')}`);
            dbLog.warn(`Total rows: ${rowCount}`);
            
            if (sampleData.length > 0) {
                dbLog.warn(`Sample data:`);
                printTable(sampleData);
            }
            
            if (!force) {
                const confirmed = await confirmAction(`Are you sure you want to DROP table "${table}" with ${rowCount} row(s)? THIS CANNOT BE UNDONE!`);
                if (!confirmed) {
                    dbLog.cancel(`Drop cancelled by user`);
                    return this;
                }
            }
            
            this.sqlDB.prepare(query).run();
            dbLog.drop(`TABLE "${table}" (${rowCount} rows deleted)`);
            return this;
        },
        
        backupDatabase(newName, { dryRun = false } = {}) {
            if (dryRun) {
                dbLog.debug(`Backup database "${this.dbName}" → "${newName}"`);
                const tables = this.sqlDB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all().map(r => r.name);
                tables.forEach(table => {
                    const schema = this.sqlDB.prepare(`PRAGMA table_info(${table})`).all();
                    const columnDefs = schema.map(({ name, type }) => `    ${name} ${type || 'TEXT'}`).join(',\n');
                    dbLog.debug(`\nCREATE TABLE IF NOT EXISTS ${table} (\n${columnDefs}\n);`);
                    dbLog.debug(`\nINSERT INTO ${table} SELECT * FROM main.${table};`);
                });
                return this;
            }
            
            dbLog.backup(`Starting backup to "${newName}"...`);
            const backupDB = loadDatabase(newName);
            
            for (const table of this.listTables()) {
                const columns = this.getTableSchema(table);
                backupDB.createTable(table, columns);
                const data = this.getData(table);
                if (data.length > 0) {
                    backupDB.insertMany(table, data);
                }
            }
            backupDB.close();
            dbLog.backup(`Completed → ${newName}`);
            return this;
        },
        
        close() {
            this.sqlDB.close();
            dbLog.close(`Closed database: ${this.dbName}`);
        }
    };
    
    return instance;
}


module.exports = loadDatabase;