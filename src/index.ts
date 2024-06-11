import { Effect, Console } from "effect";

const getName = () => Effect.succeed("World");

const greet = (name: string) => Effect.succeed(`Hello, ${name}!`);

const program = getName().pipe(
  Effect.andThen(greet),
  Effect.andThen((greeting) => Console.log(greeting))
);

Effect.runSync(program);
