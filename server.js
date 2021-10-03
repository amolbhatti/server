const app = require("./app");

const { task } = require("./utils/schedule");
const PORT = process.env.PORT || 3000;

setInterval(task, 7200000); // send expired imager to user every 2 hrs

app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});
