require("dotenv").config();

const elastic = require("./elastic");
const data = require("./data");

(async function main() {
  const isElasticReady = await elastic.checkConnection();
  if (isElasticReady) {
    const elasticIndex = await elastic.esclient.indices.exists({
      index: elastic.index,
    });

    if (!elasticIndex.body) {
      await elastic.createIndex(elastic.index);
      await elastic.setQuotesMapping();
      await data.populateDatabase();
    }
  }
})();
