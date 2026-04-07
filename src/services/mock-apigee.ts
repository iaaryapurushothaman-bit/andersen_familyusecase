// Empty replacement for ApigeeLlm to bypass "Unexpected super" bug in ADK web distribution.
export class ApigeeLlm {
    static supportedModels = [];
    constructor() {
        throw new Error('ApigeeLlm is bypassed in this environment.');
    }
}
