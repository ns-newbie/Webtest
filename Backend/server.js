const express = require('express');
const initSqlJs = require('sql.js');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_FILE = './shop.db';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

initSqlJs().then(SQL => {
  let db;

  // Tải CSDL từ file nếu đã tồn tại, ngược lại tạo mới
  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // Hàm tự động ghi dữ liệu SQLite ra file cứng
  function saveDb() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }

  // Khởi tạo bảng sản phẩm
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    image TEXT
  )`);

  // Kiểm tra và chèn dữ liệu mẫu nếu bảng trống
  const result = db.exec("SELECT COUNT(*) AS count FROM products");
  const count = result.length > 0 ? result[0].values[0][0] : 0;

  if (count === 0) {
    db.run("INSERT INTO products (name, price, image) VALUES (?, ?, ?)", ["Áo Thun Basic", 150000, "https://via.placeholder.com/150"]);
    db.run("INSERT INTO products (name, price, image) VALUES (?, ?, ?)", ["Quần Jeans Nam", 350000, "https://via.placeholder.com/150"]);
    db.run("INSERT INTO products (name, price, image) VALUES (?, ?, ?)", ["Giày Sneaker", 500000, "https://via.placeholder.com/150"]);
    saveDb();
    console.log('Đã khởi tạo CSDL và thêm dữ liệu mẫu thành công.');
  } else {
    console.log('Đã kết nối CSDL SQLite thành công.');
  }

  // API Lấy danh sách sản phẩm
  app.get('/api/products', (req, res) => {
    try {
      const resArr = db.exec("SELECT * FROM products");
      if (resArr.length === 0) return res.json([]);

      const columns = resArr[0].columns;
      const values = resArr[0].values;
      const products = values.map(row => {
        let obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
      });

      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Tạo đơn hàng test
  app.post('/api/orders', (req, res) => {
    const { cart, total } = req.body;
    console.log("Đơn hàng mới nhận được:", { cart, total });
    res.json({ status: "success", message: "Đặt hàng test thành công!" });
  });

  app.listen(PORT, () => {
    console.log(`Server chạy tại: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Lỗi khởi tạo Database:", err);
});
