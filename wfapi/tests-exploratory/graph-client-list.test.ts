import { GraphError } from "@microsoft/microsoft-graph-client";
import { List } from "@microsoft/microsoft-graph-types";
import { getTestSiteId } from "./graph-client-site.test";
import { getTestGraphClient } from "./graph-client";
import { getTestConfig } from "./test-config";

const testConfig = getTestConfig();

const graphClient = getTestGraphClient();

export const getTestList = async (
  listIdOrTitle: string = `${testConfig.GRAPH_LIST_NAME}`
) => {
  const testSiteId = await getTestSiteId();
  const apiPath = `/sites/${testSiteId}/lists/${listIdOrTitle}`;

  console.log(`Getting List from API path: ${apiPath}`);
  return graphClient.api(apiPath).get() as List;
};

export const getTestListId = async () => {
  const list = await getTestList();
  return list.id;
};

test("Get list response has List type", async () => {
  const result = await getTestList();

  expect(result.id).toBeDefined();
  expect(result.name).toBeDefined();
  expect(result.displayName).toBeDefined();
  expect(result.webUrl).toBeDefined();
  expect(result.list).toBeDefined();
  console.log(`Result from get-list: ${JSON.stringify(result)}`);
});

test("Get list promise rejects for an invalid list id or title", async () => {
  expect.assertions(3);

  try {
    await getTestList("invalid-list-id-or-title");
  } catch (error) {
    console.log(
      `Error from get-list for invalid list id or title: ${JSON.stringify(
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
