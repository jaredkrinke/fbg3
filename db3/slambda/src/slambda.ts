import * as AwsLambda from "aws-lambda";

// Useful definitions
const trace = (process.env.TRACE === "1");

export const statusCode = {
    ok: 200,
    badRequest: 400,
    notFound: 404,
    internalServerError: 500,
};

// Validation library
export function createStringValidator(pattern: RegExp): (x: any) => string {
    return function (x) {
        if (typeof(x) === "string" && pattern.test(x)) {
            return x;
        } else {
            throw new Error("Invalid string");
        }
    };
}

export function createNumberValidator(min: number, max: number): (x: any) => number {
    return function (x) {
        let number = undefined;
        if (typeof(x) === "number") {
            number = x;
        } else if (typeof(x) === "string") {
            number = parseInt(x);
        }
    
        if (number !== undefined && !isNaN(number) && number >= min && number <= max) {
            return number;
        } else {
            throw new Error("Invalid number");
        }
    }
}

export type ValidatorMap<T> = {
    [P in keyof T]: (input: any) => T[P];
};

export function createValidator<T>(validator: ValidatorMap<T>): (input: object) => T {
    return function (input: object): T {
        let result = {};
        for (let key in input) {
            if (typeof(key) !== "string") {
                throw new Error("Invalid field");
            }
    
            const fieldName = key as string;
            const fieldValidator = validator[fieldName];
            if (!fieldValidator) {
                throw new Error("Extraneous field");
            }
    
            result[fieldName] = fieldValidator(input[fieldName]);
        }

        for (let key in validator) {
            if (typeof(key) === "string") {
                const fieldName = key as string;
                if (input[fieldName] === undefined || input[fieldName] === null) {
                    throw new Error("Missing field");
                }
            }
        }

        return result as T;
    };
}

// TODO: Where is the method exposed? Need to validate that...
export function createJsonAsTextHandler<TRequest, TResponse>(validate: (input: object) => TRequest, handle: (record: TRequest) => Promise<TResponse>): AwsLambda.APIGatewayProxyHandler {
    const f: AwsLambda.APIGatewayProxyHandler = async (request) => {
        try {
            const record = validate(JSON.parse(request.body));
            try {
                const response = await handle(record);
                return {
                    statusCode: statusCode.ok,
                    headers: {
                        // Allow Cross-Origin Resource Sharing
                        // TODO: Allow configuring CORS
                        "Access-Control-Allow-Origin": "*",
                    },
                    body: JSON.stringify(response),
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
    return f;
}

// TODO: Consolidate
export function createJsonAsTextGetHandler<TRequest, TResponse>(validate: (input: object) => TRequest, handle: (record: TRequest) => Promise<TResponse>): AwsLambda.APIGatewayProxyHandler {
    const f: AwsLambda.APIGatewayProxyHandler = async (request) => {
        try {
            const record = validate(request.queryStringParameters);
            try {
                const response = await handle(record);
                return {
                    statusCode: statusCode.ok,
                    // TODO: Not needed for GET, right?
                    headers: {
                        // Allow Cross-Origin Resource Sharing
                        // TODO: Allow configuring CORS
                        "Access-Control-Allow-Origin": "*",
                    },
                    body: JSON.stringify(response),
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
    return f;
}
