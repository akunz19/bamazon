var inquirer = require("inquirer");
var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bamazon"
});
connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  afterConnection(1);
});

var itemObjs = []; //holds items
var str = "";
var idSelected; //stores product ID from selectProduct
var newQTY; //stores new qty from getQuantity

function afterConnection(id) {
  connection.query("SELECT * from products", function(err, res) {
    for (var i = 0; i < res.length; i++) {
      var name = str.concat(
        //creates name key value pair for inquirer choices
        "id: ",
        res[i].item_id,
        " name: ",
        res[i].product_name,
        " dept: ",
        res[i].dept_name,
        " price: $",
        res[i].price,
        " quantity: ",
        res[i].stock_qty
      );
      var item = {
        //item object for each choice
        name: name,
        value: res[i].item_id, //value to be returned by inquirer answer
        qty: res[i].stock_qty
      };
      itemObjs.push(item); //push item object to itmObjs array for inquirer choices
    }
    selectProduct();
  });
}

function selectProduct() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Welcome to Bamazon! Please select a product",
        choices: itemObjs,
        name: "idSelected"
      }
    ])
    .then(function(answer) {
      try {
        console.log("you selected", answer);
        idSelected = answer.idSelected; //stores answer in global variable
        getQuantity(idSelected);
      } catch (error) {
        console.error(error);
      }
    });
}

//gets quantity
function getQuantity(id) {
  inquirer
    .prompt([
      {
        type: "number",
        message: "Please enter the quantity you would like to buy.\nQuantity:",
        name: "qty"
      }
    ])
    .then(function(answer) {
      try {
        console.log(answer.qty, id);
        connection.query(
          "select * from products where item_id = ?",
          id,
          function(err, res) {
            if (answer.qty > 0 && answer.qty <= res[0].stock_qty) {
              if (err) {
                throw err;
              }
              newQTY = res[0].stock_qty - answer.qty; //stores updated quantity in global variable
              updateQuantity();
              return true;
            } else {
              if (err) {
                throw err;
              }
              console.log("invalid qty");
              connection.end();
              return false;
            }
          }
        );
      } catch (error) {
        console.error(error);
      }
    });
}

function updateQuantity() {
  if (newQTY >= 0) {
    //checks to make sure item is in stock
    connection.query(
      "update products set stock_qty = ? where item_id = ?",
      [newQTY, idSelected],
      function(err) {
        if (err) {
          throw err;
        }
        console.log("Congratulations! You purchased was successful!");
        connection.end();
      }
    );
  } else {
    connection.end();
  }
}
