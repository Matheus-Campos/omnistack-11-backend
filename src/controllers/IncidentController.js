const connection = require('../database/connection');

const tableName = 'incidents';

module.exports = {
    async index(req, res) {
        const { page, per_page } = req.query;

        const pageSize = per_page || 5;
        const pageIndex = page || 1;

        const [count] = await connection(tableName).count();

        const incidents = await connection(tableName)
            .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
            .limit(pageSize)
            .offset((pageIndex - 1) * pageSize)
            .select([
                'incidents.*',
                'ongs.name',
                'ongs.email',
                'ongs.whatsapp',
                'ongs.city',
                'ongs.uf'
            ]);

        res.header('X-Total-Count', count['count(*)']);

        return res.json(incidents);
    },
    async create(req, res) {
        const { title, description, value } = req.body;
        const { authorization: ong_id } = req.headers;

        const [id] = await connection(tableName).insert({
            title,
            description,
            value,
            ong_id,
        });

        return res.json({ id })
    },
    async delete(req, res) {
        const { id } = req.params;
        const { authorization: ong_id } = req.headers;

        const incident = await connection(tableName)
            .where('id', id)
            .select('ong_id')
            .first();

        if (incident.ong_id !== ong_id) {
            return res.status(401).json({ error: 'Operation not permitted.' });
        }

        await connection(tableName).where('id', id).delete();

        return res.status(204).send();
    }
};