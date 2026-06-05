import {vi} from "vitest";
import "../src/global.js";
import {Argv} from "../src/argv";
import {Utils} from "../src/utils";
import {GitData} from "../src/git-data";
import {WriteStreamsMock} from "../src/write-streams";

let writeStreams;
let gitData: GitData;
let argv: Argv;

beforeEach(async () => {
    writeStreams = new WriteStreamsMock();
    gitData = await GitData.init("tests", writeStreams);
    argv = await Argv.build({}, writeStreams);
    vi.restoreAllMocks();
});

/* eslint-disable @stylistic/quotes */
const tests = [
    {rule: '"Hello World" =~ "/hello world/i"', evalResult: true},
    {rule: '"Hello World" =~ /hello world/i', evalResult: true},
    {rule: '"Hello World" =~ /Hello (?i)world/', evalResult: true},
    {rule: '"1.11" =~ /^([[:digit:]]+(.[[:digit:]]+)*|latest)$/', evalResult: true},
    {rule: '"foo" !~ /foo/', evalResult: false},
    {rule: '"foo" =~ /foo/', evalResult: true},
    {rule: '"foo"=~ /foo/', evalResult: true},
    {rule: '"foo"=~/foo/', evalResult: true},
    {rule: '"foo"=~  /foo/', evalResult: true},
    {rule: '"[foo" =~ /\\[foo/', evalResult: true},
    {rule: '"[foo" =~ /\\[bar/', evalResult: false},
    {rule: '"foo" =~ "/foo/"', evalResult: true},
    {rule: '"test/url" =~ "/test/ur/"', evalResult: true},
    {rule: '"test/url" =~ "/test\\/ur/"', evalResult: true},
    {rule: '"test/url" =~ /test/ur/', expectedErrSubStr: "Error attempting to evaluate the following rules:"},
    {rule: '"[foo" =~ "/\\[foo/"', evalResult: true},
    {rule: '"foo" =~ "/\\[foo/"', evalResult: false},
    {rule: '"[foo" =~ "/\\[bar/"', evalResult: false},
    {rule: '"v12" =~ "/^v\\d+$/"', evalResult: true},
    {rule: '"master" =~ /master$/', evalResult: true},
    {rule: '"23" =~ "1234"', evalResult: true},
    {rule: '"23" =~ \'1234\'', evalResult: true},
    {rule: '"1234" =~ "23"', evalResult: false},
    {rule: '"1234" =~ \'23\'', evalResult: false},
    {rule: '"23" !~ "1234"', evalResult: false},
    {rule: '"1234" !~ "23"', evalResult: true},
    {rule: '"23" =~ "\\"1234"', evalResult: true},
    {rule: '"a" =~ "a/xyz/c"', evalResult: true},
    {rule: '"b" =~ "a\\b"', evalResult: true},
    {rule: '"23" =~ \'"1234\'', evalResult: true},
    {rule: '"23" =~ "\'1234"', evalResult: true},
    {rule: '$MISSING =~ "foo"', evalResult: true},
    {rule: '$MISSING !~ "foo"', evalResult: false},
    {rule: '"23" =~ /1234/', evalResult: false},
    {rule: '$CI_COMMIT_BRANCH && $GITLAB_FEATURES =~ /\bdependency_scanning\b/ && $CI_GITLAB_FIPS_MODE == "true"', evalResult: false},
    {rule: '($CI_MERGE_REQUEST_SOURCE_BRANCH_NAME =~ /^perf_.*$/)', evalResult: false},
    {rule: '("qwerty" =~ /^perf_.*$/)', evalResult: false},
    {rule: `"product-name/v0.0.0+build.0" =~ /^(?:product-name\\/)?v\\d+\\.\\d+\\.\\d+.*/`, evalResult: true},
];
/* eslint-enable @stylistic/quotes */

describe("gitlab rules regex", () => {
    tests.filter(t => !t.expectedErrSubStr)
        .forEach((t) => {
            test(`- if: '${t.rule}'\n\t => ${t.evalResult}`, async () => {
                const rules = [ {if: t.rule} ];
                const evaluateRuleIfSpy = vi.spyOn(Utils, "evaluateRuleIf");

                Utils.getRulesResult({argv, cwd: "", rules, variables: {}}, gitData);
                expect(evaluateRuleIfSpy).toHaveReturnedWith(t.evalResult);
            });
        });
});

describe("gitlab rules regex [invalid]", () => {
    tests.filter(t => t.expectedErrSubStr)
        .forEach((t) => {
            test(`- if: '${t.rule}'\n\t to throws error that contains \`${t.expectedErrSubStr}\``, async () => {
                const rules = [ {if: t.rule} ];

                try {
                    Utils.getRulesResult({argv, cwd: "", rules, variables: {}}, gitData);
                } catch (e: any) {
                    expect(e.message).toContain(t.expectedErrSubStr);
                    return;
                }

                throw new Error("Error is expected but not thrown/caught");
            });
        });
});
