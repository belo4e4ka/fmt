export default async (db, req, res, data) => {
    const result = await db.page.getAll();
    return {result};
};