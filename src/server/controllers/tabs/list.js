export default async (db, req, res, data) => {
    const result = await db.tab.getAll();
    return {result};
};