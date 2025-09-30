const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

app.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let successCount = 0;
      let failedRows = [];

      for (const user of results) {
        try {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          await prisma.user.create({
            data: { email: user.email, password: hashedPassword }
          });
          successCount++;
        } catch (err) {
          failedRows.push({ email: user.email, error: err.message });
        }
      }

      fs.unlinkSync(req.file.path); 
      res.json({ message: `Processed CSV. Success: ${successCount}, Failed: ${failedRows.length}`, failedRows });
    });
});
