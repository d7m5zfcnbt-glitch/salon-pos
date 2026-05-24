const supabaseUrl = "https://oriooahtniqqnuldybal.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaW9vYWh0bmlxcW51bGR5YmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDY4MzAsImV4cCI6MjA5NTEyMjgzMH0.9JWDo1vXM27KvDJKaDH9fwe7G4Ag_4jQeOb0rimC6Y0"

const db = window.supabase.createClient(supabaseUrl, supabaseKey)

let products = []
let techniques = []
let currentOrderItems = []
let currentUser = null

async function login(){
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  const { data, error } = await db.auth.signInWithPassword({ email, password })

  if(error){
    console.log(error)
    alert("登入失敗")
    return
  }

  currentUser = data.user
  document.getElementById("authBox").style.display = "none"
  document.getElementById("posApp").style.display = "grid"

  await loadAllData()
}

async function loadAllData(){
  await loadProducts()
  await loadTechniques()
  await loadOrders()
  showPage("orderPage")
}

function showPage(pageId){
  document.querySelectorAll(".page").forEach(page => {
    page.style.display = "none"
  })

  document.getElementById(pageId).style.display = "block"
}

async function loadProducts(){
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("id", { ascending:false })

  if(error){
    console.log(error)
    return
  }

  products = data
  renderProducts()
  renderProductOrderList()
}

async function addProduct(){
  const name = document.getElementById("productName").value
  const stock = Number(document.getElementById("productStock").value)
  const price = Number(document.getElementById("productPrice").value)

  if(!name || stock < 0 || price <= 0){
    alert("請輸入完整商品資料")
    return
  }

  const { error } = await db.from("products").insert([{ name, stock, price }])

  if(error){
    console.log(error)
    alert("新增商品失敗")
    return
  }

  document.getElementById("productName").value = ""
  document.getElementById("productStock").value = ""
  document.getElementById("productPrice").value = ""

  loadProducts()
}

async function addStock(index){
  const product = products[index]

  await db
    .from("products")
    .update({ stock: product.stock + 1 })
    .eq("id", product.id)

  loadProducts()
}

async function minusStock(index){
  const product = products[index]

  if(product.stock <= 0){
    alert("庫存不能小於 0")
    return
  }

  await db
    .from("products")
    .update({ stock: product.stock - 1 })
    .eq("id", product.id)

  loadProducts()
}

async function deleteProduct(index){
  const product = products[index]

  if(!confirm(`確定刪除「${product.name}」？`)){
    return
  }

  await db.from("products").delete().eq("id", product.id)

  loadProducts()
}

function renderProducts(){
  const productList = document.getElementById("productList")
  productList.innerHTML = ""

  products.forEach((product,index) => {
    productList.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${product.name}</strong><br>
          售價：NT$${product.price}｜庫存：${product.stock}
        </div>

        <div class="actions">
          <button onclick="addStock(${index})">＋庫存</button>
          <button onclick="minusStock(${index})">－庫存</button>
          <button class="danger" onclick="deleteProduct(${index})">刪除</button>
        </div>
      </div>
    `
  })
}

async function loadTechniques(){
  const { data, error } = await db
    .from("techniques")
    .select("*")
    .order("id", { ascending:false })

  if(error){
    console.log(error)
    return
  }

  techniques = data
  renderTechniques()
  renderTechniqueOrderList()
}

async function addTechnique(){
  const name = document.getElementById("techniqueName").value
  const price = Number(document.getElementById("techniquePrice").value)

  if(!name || price <= 0){
    alert("請輸入完整技術資料")
    return
  }

  const { error } = await db.from("techniques").insert([{ name, price }])

  if(error){
    console.log(error)
    alert("新增技術失敗")
    return
  }

  document.getElementById("techniqueName").value = ""
  document.getElementById("techniquePrice").value = ""

  loadTechniques()
}

async function deleteTechnique(index){
  const technique = techniques[index]

  if(!confirm(`確定刪除「${technique.name}」？`)){
    return
  }

  await db.from("techniques").delete().eq("id", technique.id)

  loadTechniques()
}

function renderTechniques(){
  const techniqueList = document.getElementById("techniqueList")
  techniqueList.innerHTML = ""

  techniques.forEach((technique,index) => {
    techniqueList.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${technique.name}</strong><br>
          預設價格：NT$${technique.price}
        </div>

        <div class="actions">
          <button class="danger" onclick="deleteTechnique(${index})">刪除</button>
        </div>
      </div>
    `
  })
}

function renderTechniqueOrderList(){
  const list = document.getElementById("techniqueOrderList")
  if(!list) return

  list.innerHTML = ""

  techniques.forEach(technique => {
    list.innerHTML += `
      <button class="item-button" onclick="addToOrder('technique','${escapeText(technique.name)}',${technique.price},null)">
        ${technique.name}<br>
        NT$${technique.price}
      </button>
    `
  })
}

function renderProductOrderList(){
  const list = document.getElementById("productOrderList")
  if(!list) return

  list.innerHTML = ""

  products.forEach(product => {
    list.innerHTML += `
      <button class="item-button" onclick="addToOrder('product','${escapeText(product.name)}',${product.price},${product.id})">
        ${product.name}<br>
        NT$${product.price}<br>
        庫存：${product.stock}
      </button>
    `
  })
}

function addToOrder(type, name, price, productId){
  const existingItem = currentOrderItems.find(item =>
    item.item_type === type &&
    item.item_name === name
  )

  if(existingItem){
    existingItem.quantity += 1
    existingItem.subtotal = existingItem.quantity * existingItem.unit_price
  }else{
    currentOrderItems.push({
      item_type:type,
      item_name:name,
      product_id:productId,
      quantity:1,
      unit_price:price,
      subtotal:price
    })
  }

  renderCurrentOrder()
}

function removeOrderItem(index){
  currentOrderItems.splice(index,1)
  renderCurrentOrder()
}

function renderCurrentOrder(){
  const orderItems = document.getElementById("currentOrderItems")
  const totalAmountBox = document.getElementById("totalAmount")
  const salesBox = document.getElementById("salesBox")

  orderItems.innerHTML = ""

  let total = 0

  currentOrderItems.forEach((item,index) => {
    total += item.subtotal

    orderItems.innerHTML += `
      <div class="cart-item">
        <div>
          <strong>${item.item_name}</strong><br>
          ${item.item_type === "technique" ? "技術" : "商品"}｜
          數量：${item.quantity}｜
          NT$${item.subtotal}
        </div>

        <button class="danger" onclick="removeOrderItem(${index})">移除</button>
      </div>
    `
  })

  totalAmountBox.innerHTML = `總金額：NT$${total}`
  salesBox.innerHTML = `總金額：NT$${total}`
}

async function submitOrder(){
  const orderNumber = document.getElementById("orderNumber").value
  const customerName = document.getElementById("customerName").value
  const designerName = document.getElementById("designerName").value
  const paymentMethod = document.getElementById("paymentMethod").value
  const note = document.getElementById("orderNote").value

  if(!orderNumber || !customerName || !designerName){
    alert("請輸入單號、客人姓名與設計師")
    return
  }

  if(currentOrderItems.length === 0){
    alert("請先加入技術或商品")
    return
  }

  const totalAmount = currentOrderItems.reduce((sum,item) => sum + item.subtotal, 0)

  const { data: orderData, error: orderError } = await db
    .from("orders")
    .insert([{
      order_number:orderNumber,
      customer_name:customerName,
      designer_name:designerName,
      total_amount:totalAmount,
      payment_method:paymentMethod,
      note:note
    }])
    .select()
    .single()

  if(orderError){
    console.log(orderError)
    alert("建立訂單失敗")
    return
  }

  const orderItems = currentOrderItems.map(item => ({
    order_id:orderData.id,
    item_type:item.item_type,
    item_name:item.item_name,
    quantity:item.quantity,
    unit_price:item.unit_price,
    subtotal:item.subtotal
  }))

  const { error: itemsError } = await db
    .from("order_items")
    .insert(orderItems)

  if(itemsError){
    console.log(itemsError)
    alert("建立訂單明細失敗")
    return
  }

  for(const item of currentOrderItems){
    if(item.item_type === "product" && item.product_id){
      const product = products.find(p => p.id === item.product_id)

      if(product){
        await db
          .from("products")
          .update({ stock: product.stock - item.quantity })
          .eq("id", product.id)
      }
    }
  }

  document.getElementById("orderNumber").value = Number(orderNumber) + 1
  document.getElementById("customerName").value = ""
  document.getElementById("designerName").value = ""
  document.getElementById("orderNote").value = ""

  currentOrderItems = []
  renderCurrentOrder()

  await loadProducts()
  await loadOrders()

  alert("訂單建立完成")
}

async function loadOrders(){
  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending:false })

  if(error){
    console.log(error)
    return
  }

  renderOrders(data)
}

function renderOrders(orders){
  const orderList = document.getElementById("orderList")
  orderList.innerHTML = ""

  orders.forEach(order => {
    const time = new Date(order.created_at).toLocaleString("zh-TW", {
      timeZone:"Asia/Taipei",
      year:"numeric",
      month:"2-digit",
      day:"2-digit",
      hour:"2-digit",
      minute:"2-digit"
    })

    orderList.innerHTML += `
      <div class="list-item">
        <div>
          <strong>#${order.order_number}</strong><br>
          客人：${order.customer_name}｜
          設計師：${order.designer_name}<br>
          付款：${order.payment_method}｜
          ${time}
        </div>

        <div>
          <strong>NT$${order.total_amount}</strong>
        </div>
      </div>
    `
  })
}

function escapeText(text){
  return String(text).replace(/'/g,"\\'")
}

document.getElementById("posApp").style.display = "none"
