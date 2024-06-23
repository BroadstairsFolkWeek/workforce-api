import { Layer } from "effect";
import { FetchApi } from "./fetch-api";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

export const fetchApiLive = Layer.succeed(
  FetchApi,
  FetchApi.of({
    fetchGet: (url: string) =>
      HttpClientRequest.get(url).pipe(
        HttpClient.fetch,
        HttpClientResponse.arrayBuffer
      ),
  })
);
