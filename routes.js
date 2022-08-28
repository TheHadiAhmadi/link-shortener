const router = require("express").Router;
const path = require("path");
const fs = require("fs/promises");
const deta = require("deta").Deta(process.env.DETA_PROJECT_KEY);
const links = deta.Base("links");
const routes = router();

async function isAvailable(name) {
  const result = await links.fetch({ name }, { limit: 1 });
  console.log(result.items);
  if (result.items.length === 0) return true;
  return false;
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
  return links.insert({ name, link, clicks: 0 });
}

routes.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/add.html"));
});

routes.get("/success", async (req, res) => {
  const link = req.query.link;

  let fileContent = await fs.readFile(
    path.join(__dirname, "views/success.html"),
    "utf-8"
  );
  fileContent = fileContent.replace(/LINK/g, link);
  res.send(fileContent);
});

routes.post("/add", async (req, res) => {
  const link = req.body.link;

  if (!link) return res.send(errorResponse(400, "invalid input"));

  let name = req.body.name;

  if (!name) {
    name = await suggestName();
  } else {
    if (!(await isAvailable(name))) {
      return res.send(errorResponse(409, "this Name is not available"));
    }
  }

  const result = await addLink({ name, link });

  req.link = link.link;
  return res.redirect(`/success?link=${result.name}`);
});

routes.get("/:name", async (req, res) => {
  const name = req.params.name;

  const { items } = await links.fetch({ name }, { limit: 1 });

  console.log(items);
  if (items.length === 0)
    return res.send(errorResponse(404, "this Link is not available"));
  const link = items[0];

  await links.update(
    { name: link.name, clicks: (link.clicks ?? 0) + 1 },
    link.key
  );

  return res.redirect(link.link);
});

module.exports = routes;
