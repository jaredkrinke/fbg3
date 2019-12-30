import * as LZString from "lz-string";
import * as Firebase from "firebase-admin";
import * as fbc from "fbc";
import * as AwsLambda from "aws-lambda";

const trace = (process.env.TRACE === "1");

// Input validation
const statusCode = {
    ok: 200,
    badRequest: 400,
    notFound: 404,
    internalServerError: 500,
};

function createStringValidator(pattern: RegExp): (x: any) => string | undefined {
    return function (x) {
        return (typeof(x) === "string" && pattern.test(x)) ? x : undefined;
    };
}

function createNumberValidator(min: number, max: number): (x: any) => number | undefined {
    return function (x) {
        let number = undefined;
        if (typeof(x) === "number") {
            number = x;
        } else if (typeof(x) === "string") {
            number = parseInt(x);
        }
    
        return (number !== undefined && !isNaN(number) && number >= min && number <= max) ? number : undefined;
    }
}

const base64Pattern = /^[A-Za-z0-9+/=]*$/;
function isReplay(x: any): string | undefined {
    return (typeof(x) === "string" && base64Pattern.test(x) && LZString.decompressFromBase64(x).length >= 6) ? x : undefined;
}

const validators = {
    mode: createNumberValidator(1, 3),
    seed: createStringValidator(/^[0-9a-f]{32}$/),
    host: createStringValidator(/^[a-z]{15}$/),
    initials: createStringValidator(/^[a-z]{3}$/),

    // TODO: If this gets obscured, this logic will probably need to change
    score: createNumberValidator(0, 999999),
    replay: isReplay,
}

interface ValidatorMap {
    [propname: string]: (x: any) => any;
}

function validate(validators: ValidatorMap, input: object) {
    let o = { valid: true };
    for (let key in validators) {
        // TODO: Ensure no extraneous keys
        let v = validators[key](input[key]);
        if (v === undefined) {
            o.valid = false;
            if (trace) {
                console.log(`Invalid request (field ${key}: ${input[key]})`);
            }
            break;
        } else {
            o[key] = v;
        }
    }
    return o;
}

interface Score {
    valid: boolean; // TODO: Make this unnecessary

    mode: number;
    seed: string;
    host: string;
    initials: string;
    score: number;
    replay: string;
}

interface ScoreDocument {
    // Document name is the seed
    mode: number;
    host: string;
    initials: string;
    score: number;
    replay: Buffer;
}

// Database integration
const root = Firebase
    .initializeApp({ credential: Firebase.credential.cert(fbc as Firebase.ServiceAccount) })
    .firestore()
    .collection("fbg-scores");

function scoreDocumentFromScore(score: Score): ScoreDocument {
    return {
        mode: score.mode,
        host: score.host,
        initials: score.initials,
        score: score.score,
        replay: Buffer.from(score.replay),
    }
}

async function handleAddScore(score: Score): Promise<void> {
    await root.doc(score.seed).set(scoreDocumentFromScore(score));
}

export const handler: AwsLambda.APIGatewayProxyHandler = async (request) => {
    try {
        // Use "text/plain" content type to avoid OPTIONS preflight
        const record = validate(validators, JSON.parse(request.body)) as Score;

        try {
            await handleAddScore(record);

            // TODO: Upload to database
            return {
                statusCode: statusCode.ok,
                headers: {
                    // Allow Cross-Origin Resource Sharing
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({}),
            };
        } catch (err) {
            if (trace) {
                console.error(err);
            }
            return { statusCode: statusCode.internalServerError, body: "" };
        }
    } catch (err) {
        if (trace) {
            console.error(err);
        }
        return { statusCode: statusCode.badRequest, body: "" }
    }
}
