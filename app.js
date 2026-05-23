/* =========================
   Supabase
========================= */

const supabaseUrl = "https://oriooahtniqqnuldybal.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaW9vYWh0bmlxcW51bGR5YmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDY4MzAsImV4cCI6MjA5NTEyMjgzMH0.9JWDo1vXM27KvDJKaDH9fwe7G4Ag_4jQeOb0rimC6Y0"

const db = window.supabase.createClient(supabaseUrl, supabaseKey)

/* =========================
   資料
========================= */

let products = []
let totalSales = 0
let currentUser = null

/* =========================
   登入
========================= */

async function login(){
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  })

  if(error){
    console.log(error)
    alert("登入失敗")
    return
  }

  currentUser = data.user

  document.getElementById("authBox").style.display = "none"
  document.getElementById("posApp").style.display = "grid"

  loadProducts()
  loadSales()
}

/* =========================
   讀取商品
========================= */

async function loadProducts(){
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("id", { ascending:false })

  if(error){
    console.log(error)
    alert("讀取商品失敗")
    return
  }

  products = data
  renderProducts()
}

/* =========================
   讀取銷售紀錄
========================= */

async function loadSales(){
  const { data, error } = await db
    .from("sales")
    .select("*")
    .order("created_at", { ascending:false })

  if(error){
    console.log(error)
    return
  }

  totalSales = data.reduce((sum, item) => sum + Number(item.price), 0)

  renderSales(data)
  updateSalesBox()
}

/* =========================
   新增商品
========================= */

async function addProduct(){
  const name = document.getElementById("productName").value
  const stock = Number(document.getElementById("productStock").value)
  const price = Number(document.getElementById("productPrice").value)

  if(name === "" || stock <= 0 || price <= 0){
    alert("請輸入完整資料")
    return
  }

  const { error } = await db
    .from("products")
    .insert([
      {
        name,
        stock,
        price
      }
    ])

  if(error){
    console.log(error)
    alert("新增失敗")
    return
  }

  document.getElementById("productName").value = ""
  document.getElementById("productStock").value = ""
  document.getElementById("productPrice").value = ""

  loadProducts()
}

/* =========================
   賣出商品
========================= */

async function sellProduct(index){
  const product = products[index]

  if(product.stock <= 0){
    alert("庫存不足")
    return
  }

  const { error:updateError } = await db
    .from("products")
    .update({
      stock:product.stock - 1
    })
    .eq("id", product.id)

  if(updateError){
    console.log(updateError)
    alert("銷售失敗")
    return
  }

  const { error:salesError } = await db
    .from("sales")
    .insert([
      {
        product_name:product.name,
        price:product.price
      }
    ])

  if(salesError){
    console.log(salesError)
    alert("銷售紀錄寫入失敗")
    return
  }

  loadProducts()
  loadSales()
}

/* =========================
   增加庫存
========================= */

async function addStock(index){
  const product = products[index]

  const { error } = await db
    .from("products")
    .update({
      stock:product.stock + 1
    })
    .eq("id", product.id)

  if(error){
    console.log(error)
    alert("補庫存失敗")
    return
  }

  loadProducts()
}

/* =========================
   減少庫存
========================= */

async function minusStock(index){
  const product = products[index]

  if(product.stock <= 0){
    alert("庫存不能小於 0")
    return
  }

  const { error } = await db
    .from("products")
    .update({
      stock:product.stock - 1
    })
    .eq("id", product.id)

  if(error){
    console.log(error)
    alert("扣庫存失敗")
    return
  }

  loadProducts()
}

/* =========================
   刪除商品
========================= */

async function deleteProduct(index){
  const product = products[index]

  const confirmDelete = confirm(`確定刪除「${product.name}」？`)

  if(!confirmDelete){
    return
  }

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", product.id)

  if(error){
    console.log(error)
    alert("刪除失敗")
    return
  }

  loadProducts()
}

/* =========================
   匯出 CSV
========================= */

function exportCSV(){
  let csv = "商品名稱,售價,庫存\n"

  products.forEach(product => {
    csv += `${product.name},${product.price},${product.stock}\n`
  })

  csv += `\n總營收,${totalSales}\n`

  const blob = new Blob([csv], {
    type:"text/csv;charset=utf-8;"
  })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "salon-pos-report.csv"
  link.click()
}

/* =========================
   畫面：商品卡
========================= */

function renderProducts(){
  const productList = document.getElementById("productList")

  productList.innerHTML = ""

  products.forEach((product,index) => {
    productList.innerHTML += `
      <div class="product-card">

        <div class="product-name">${product.name}</div>

        <div class="product-price">NT$${product.price}</div>

        <div class="product-stock">庫存：${product.stock}</div>

        <div class="product-actions">
          <button class="sell-btn" onclick="sellProduct(${index})">賣出</button>
          <button class="stock-btn" onclick="addStock(${index})">＋庫存</button>
          <button class="minus-btn" onclick="minusStock(${index})">－庫存</button>
          <button class="delete-btn" onclick="deleteProduct(${index})">刪除</button>
        </div>

      </div>
    `
  })

  updateSalesBox()
}

/* =========================
   畫面：銷售紀錄
========================= */

function renderSales(sales){
  const salesList = document.getElementById("salesList")

  if(!salesList){
    return
  }

  salesList.innerHTML = ""

  sales.forEach(item => {
    const time = new Date(item.created_at)

    salesList.innerHTML += `
      <div class="sale-item">

        <div>
          <strong>${item.product_name}</strong><br>
          <span>NT$${item.price}</span>
        </div>

        <div class="sale-time">
          ${time.toLocaleString()}
        </div>

      </div>
    `
  })
}

/* =========================
   畫面：營收
========================= */

function updateSalesBox(){
  const salesBox = document.querySelector(".sales-box")

  if(salesBox){
    salesBox.innerHTML = `今日營收：NT$${totalSales}`
  }
}

/* =========================
   初始化
========================= */

document.getElementById("posApp").style.display = "none"