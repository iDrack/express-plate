import "reflect-metadata";
import { Container } from "typedi";

Container.set("logger", console);

export { Container };