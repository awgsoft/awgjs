//import { prototype } from "module";

export {};

declare global {
  interface String {
    ltrim(): string;
    getNumber(): string;
    getNumbers(): string;
    isNote(): boolean;
  }
}

String.prototype.ltrim = function () {
  return this.replace(/^\s+/, "");
};

String.prototype.getNumber = function () {
  const reg = /^[0-9]+/;
  const res = this.match(reg);
  if (!res) {
    return "";
  } else {
    return res[0];
  }
};

String.prototype.getNumbers = function () {
  //    return this.match(/^[+-,0-9\s]+/, "");
  const reg = /^[+-,0-9\s]+/;
  const res = this.match(reg);
  if (!res) {
    return "";
  } else {
    return res[0];
  }
};

String.prototype.isNote = function () {
  if (this.search(/^[cdefgab]/) < 0) return false;
  else return true;
};
