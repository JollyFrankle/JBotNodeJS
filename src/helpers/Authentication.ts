import query from "@m/mysql2";


export default class Authentication {
    static async verify(id: string, guildId?: string | null) {
        if (!guildId) {
            const rows = await query(`SELECT * FROM administrators WHERE id = ? AND id_guild IS NULL`, [id]);
            return rows.length > 0;
        } else {
            const rows = await query(`SELECT * FROM administrators WHERE id = ? AND (id_guild = ? OR id_guild IS NULL)`, [id, guildId]);
            return rows.length > 0;
        }
    }
}