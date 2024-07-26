import { GraphError } from "@microsoft/microsoft-graph-client";
import { ListItem } from "@microsoft/microsoft-graph-types";
import { getTestSiteId } from "./graph-client-site.test";
import { getTestGraphClient } from "./graph-client";
import { getTestListId } from "./graph-client-list.test";
import { getTestConfig } from "./test-config";

const testConfig = getTestConfig();

const graphClient = getTestGraphClient();

export const getTestListItem = async (
  itemId = `${testConfig.GRAPH_LIST_ITEM_ID}`
) => {
  const testSiteId = await getTestSiteId();
  const testListId = await getTestListId();
  const apiPath = `/sites/${testSiteId}/lists/${testListId}/items/${itemId}`;

  console.log(`Getting List Item from API path: ${apiPath}`);
  return graphClient.api(apiPath).get() as ListItem;
};

test("Get list item response has ListItem type", async () => {
  const result = await getTestListItem();
  console.log(`Result from get-list-item: ${JSON.stringify(result)}`);

  expect(result.id).toBeDefined();
  expect(result.fields).toBeDefined();
  expect(result.webUrl).toBeDefined();
  expect(result.parentReference).toBeDefined();
});

test("Get list item promise rejects for an non-numeric, but whole-word, list item id", async () => {
  expect.assertions(3);

  try {
    await getTestListItem("nonnumeric");
  } catch (error) {
    console.log(
      `Error from get-list-item for non-numeric list item id: ${JSON.stringify(
        error
      )}`
    );
    expect(error).toBeInstanceOf(GraphError);
    if (error instanceof GraphError) {
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("itemNotFound");
    }
  }
});

test("Get list item promise rejects for an invalid list item id", async () => {
  expect.assertions(3);

  try {
    await getTestListItem("this-is-invalid");
  } catch (error) {
    console.log(
      `Error from get-list-item for an invalid list item id: ${JSON.stringify(
        error
      )}`
    );
    expect(error).toBeInstanceOf(GraphError);
    if (error instanceof GraphError) {
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("invalidRequest");
    }
  }
});

test("Get list item promise rejects for an unknown list item id", async () => {
  expect.assertions(3);

  try {
    await getTestListItem("999999999");
  } catch (error) {
    console.log(
      `Error from get-list-item for unknown list item id: ${JSON.stringify(
        error
      )}`
    );
    expect(error).toBeInstanceOf(GraphError);
    if (error instanceof GraphError) {
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("itemNotFound");
    }
  }
});

test("Clear list item column by setting column to undefined", async () => {
  const testSiteId = await getTestSiteId();
  const testListId = await getTestListId();
  const itemId = `${testConfig.GRAPH_LIST_ITEM_ID}`;
  const apiPath = `/sites/${testSiteId}/lists/${testListId}/items/${itemId}/fields`;

  console.log(
    `Clearing column, Telephone, from List Item at API path: ${apiPath}`
  );
  return graphClient.api(apiPath).patch({
    Telephone: null,
    Version: null,
  }) as ListItem;
});
