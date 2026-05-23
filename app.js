const supabaseUrl = "你的 Supabase URL"

const supabaseKey = "你的 Publishable key"

const db = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
)

let currentUser = null

let totalSales = 0

/* =========================
   登入
========================= */

async function login(){

  const email =
    document.getElementById("loginEmail").value

  const password =
    document.getElementById("loginPassword").value

  const { data, error } =
    await db.auth.signInWithPassword({

      email,
      password

    })

  if(error){

    alert("登入失敗")

    console.log(error)

    return
  }

  currentUser = data.user

  document.getElementById("authBox").style.display = "none"

  document.getElementById("posApp").style.display = "grid"

  loadOrders()

}

/* =========================
   建立服務單
========================= */

async function createServiceOrder(){

  const orderNumber =
    document.getElementById("orderNumber").value

  const customerName =
    document.getElementById("customerName").value

  const designerName =
    document.getElementById("designerName").value

  const serviceName =
    document.getElementById("serviceName").value

  const amount =
    Number(document.getElementById("serviceAmount").value)

  const paymentMethod =
    document.getElementById("paymentMethod").value

  const note =
    document.getElementById("serviceNote").value

  if(
    orderNumber === "" ||
    customerName === "" ||
    designerName === "" ||
    serviceName === "" ||
    amount <= 0
  ){

    alert("請輸入完整資料")

    return
  }

  const { error } = await db
    .from("service_orders")
    .insert([

      {
        order_number:orderNumber,
        customer_name:customerName,
        designer_name:designerName,
        service_name:serviceName,
        amount:amount,
        payment_method:paymentMethod,
        note:note
      }

    ])

  if(error){

    console.log(error)

    alert("建立失敗")

    return
  }

  document.getElementById("orderNumber").value =
    Number(orderNumber) + 1

  document.getElementById("customerName").value = ""

  document.getElementById("designerName").value = ""

  document.getElementById("serviceName").value = ""

  document.getElementById("serviceAmount").value = ""

  document.getElementById("serviceNote").value = ""

  loadOrders()

}

/* =========================
   讀取開單
========================= */

async function loadOrders(){

  const { data, error } = await db
    .from("service_orders")
    .select("*")
    .order("id",{ ascending:false })

  if(error){

    console.log(error)

    return
  }

  renderOrders(data)

}

/* =========================
   顯示開單
========================= */

function renderOrders(orders){

  const orderList =
    document.getElementById("orderList")

  orderList.innerHTML = ""

  totalSales = 0

  orders.forEach(order => {

    totalSales += Number(order.amount)

    const time =
      new Date(order.order_date)

    orderList.innerHTML += `

      <div class="product-card">

        <div class="product-name">

          #${order.order_number}

        </div>

        <div class="product-stock">

          客人：${order.customer_name}

        </div>

        <div class="product-stock">

          設計師：${order.designer_name}

        </div>

        <div class="product-stock">

          項目：${order.service_name}

        </div>

        <div class="product-price">

          NT$${order.amount}

        </div>

        <div class="product-stock">

          ${order.payment_method}

        </div>

        <div class="product-stock">

          ${time.toLocaleString()}

        </div>

      </div>

    `

  })

  document.getElementById("salesBox").innerHTML =
    `今日營收：NT$${totalSales}`

}

/* =========================
   初始化
========================= */

document.getElementById("posApp").style.display = "none"
