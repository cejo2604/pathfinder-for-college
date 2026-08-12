import { describe, expect, it } from "vitest";
import { DEMO_STUDENTS } from "./data";
import { simulatePaths } from "./engine";
import { programPathId } from "./program-paths";

describe("program paths", () => {
  it("builds a switch path", () => {
    const p = DEMO_STUDENTS[2]!.profile;
    const paths = simulatePaths(["baseline", programPathId("switch", "ds_bs"), programPathId("minor", "cs_minor")], { profile: p });
    console.log(p.name, p.major, paths.map((x) => [x.name, x.program, x.creditsRemaining, x.additionalCost, x.scores.careerFit, x.risk]));
    expect(paths.length).toBe(3);
  });
});
