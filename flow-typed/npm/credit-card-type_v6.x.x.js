// flow-typed signature: f3cf9ecff953e3d52483356e5483e1f4
// flow-typed version: c6154227d1/credit-card-type_v6.x.x/flow_>=v0.104.x

declare module 'credit-card-type' {
  declare type ICardType = {
    niceType: string,
    type: string,
    prefixPattern: RegExp,
    exactPattern: RegExp,
    gaps: number[],
    lengths: number[],
    code: {
      name: string,
      size: number,
      ...
    },
    ...
  }

  declare type ILibrary = {
    (cardNumber: string): ICardType[],
    types: { [key: string]: ICardType, ... },
    getTypeInfo: (type: string) => ICardType | null,
    removeCard: (name: string) => void,
    addCard: (config: ICardType) => void,
    changeOrder: (name: string, position: number) => void,
    resetModifications: () => void,
    ...
  }

  declare module.exports: ILibrary
}
