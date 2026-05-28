import type { ComponentType } from "react";

type LazyPageModule = {
  Component: ComponentType;
};

export function lazyPage(loader: () => Promise<LazyPageModule>) {
  return async () => {
    const module = await loader();
    return { Component: module.Component };
  };
}
