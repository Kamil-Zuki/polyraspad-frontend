import { describe, it, expect } from "vitest"
import { parseCsvPreview } from "./parse-csv-preview"

describe("parseCsvPreview", () => {
  it("CSV: возвращает headers и rows для 'a,b,c\\n1,2,3'", async () => {
    const file = new File(["a,b,c\n1,2,3"], "data.csv", { type: "text/csv" })
    const result = await parseCsvPreview(file)
    expect(result.headers).toEqual(["a", "b", "c"])
    expect(result.rows).toEqual([["1", "2", "3"]])
  })

  it("CSV: по умолчанию maxRows = 5, обрезает строки", async () => {
    const lines = ["h1,h2", "r1,r2", "r2,r2", "r3,r2", "r4,r2", "r5,r2", "r6,r2"]
    const file = new File([lines.join("\n")], "data.csv", { type: "text/csv" })
    const result = await parseCsvPreview(file)
    expect(result.headers).toEqual(["h1", "h2"])
    expect(result.rows).toHaveLength(5)
    expect(result.rows[0]).toEqual(["r1", "r2"])
    expect(result.rows[4]).toEqual(["r5", "r2"])
  })

  it("maxRows ограничивает число строк", async () => {
    const file = new File(["a,b\n1,2\n3,4\n5,6"], "data.csv", { type: "text/csv" })
    const result = await parseCsvPreview(file, 2)
    expect(result.headers).toEqual(["a", "b"])
    expect(result.rows).toHaveLength(2)
    expect(result.rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ])
  })

  it("TSV: по расширению .tsv использует табуляцию", async () => {
    const file = new File(["x\ty\tz\n1\t2\t3"], "data.tsv", { type: "text/tab-separated-values" })
    const result = await parseCsvPreview(file)
    expect(result.headers).toEqual(["x", "y", "z"])
    expect(result.rows).toEqual([["1", "2", "3"]])
  })

  it("TSV: если первая строка содержит таб — использовать таб как разделитель", async () => {
    const file = new File(["a\tb\tc\n1\t2\t3"], "data.txt", { type: "text/plain" })
    const result = await parseCsvPreview(file)
    expect(result.headers).toEqual(["a", "b", "c"])
    expect(result.rows).toEqual([["1", "2", "3"]])
  })

  it("CSV: поля в кавычках не разбиваются по запятой внутри", async () => {
    const file = new File(['a,"b,c",d\n1,"2,3",4'], "data.csv", { type: "text/csv" })
    const result = await parseCsvPreview(file)
    expect(result.headers).toEqual(["a", "b,c", "d"])
    expect(result.rows).toEqual([["1", "2,3", "4"]])
  })
})
