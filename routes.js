const router = require("express").Router;
const deta = require("deta").Deta(process.env.DETA_PROJECT_KEY);
const links = deta.Base("links");

// const links = [];
const routes = router();

routes.get("/", (req, res) => res.send("Server is running!"));

// types of response

// success {status: 2xx, message: string, data: object}
// error {status: 4xx, message: string}

async function isAvailable(name) {
  //   const links = deta.Base('links')
    const result = await links.fetch({name}, {limit: 1})
    console.log(result)
    if(result.length === 0) return true
    return false
//   return links.findIndex((link) => link.name === name) === -1;
  // return true
}

function randomString(length) {
  let values = "abcdefghijklmnopqrstuvwxyz".split("");
  console.log(values);
  let result = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * values.length);
    result += values[index];
  }
  return result;
}

async function suggestName() {
  let link = randomString(6);

  while (!(await isAvailable(link))) {
    link = suggestName();
  }
  return link;
}

function errorResponse(status, message) {
  return { status: status ?? 500, message: message ?? "Internal Server Error" };
}

function successResponse(status, message, data) {
  return { status: status ?? 200, message: message ?? "Success", data };
}

function addLink({ name, link }) {
  return links.insert({ name, link });
// const id = randomString(16)
// links.push({name, link, id})
// return {name, link, id}
}

routes.post("/add", async (req, res) => {
  // create new short link

  // if name is specified => check availability
  // if !available return error response

  const link = req.body.link;

  if (!link) return res.send(errorResponse(400, "invalid input"));

  let name = req.body.name;

  if (!name) {
    name = suggestName();
  } else {
    if (!(await isAvailable(name))) {
      return res.send(errorResponse(409, "this Name is not available"));
    }
  }

  const result = await addLink({ name, link });

  return res.send(successResponse(200, "Link created successfully", result));
});

routes.get('/:name', async (req, res) => {
    const name = req.params.name

    const link = await links.fetch({name}, {limit: 1})

    console.log(link)
    if(link.length === 0) return res.send(errorResponse(404, "this Link is not available"))

    return res.redirect(link[0].link)
})

module.exports = routes;
