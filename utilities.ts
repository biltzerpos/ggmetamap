import { flags } from './globals';

export function colog(a) {
    if (flags.debugMode) console.log(a);
}

// Define a function that partially applies another function
export function partial(fn, ...fixedArgs) {
    return function (...freeArgs) {
        return fn(...freeArgs, ...fixedArgs);
    };
}

export function splitCamelCase(name: any) {
    let result = '';
    for (let i = 0; i < name.length; i++) {
        const char = name[i];
        // Check if the character is uppercase and not the first character
        if (char !== char.toLowerCase() && i !== 0 && name[i - 1] !== '-') {
            // If it's uppercase and not the first character, add a space before it
            result += ' ';
        }
        // Add the current character to the result
        result += char;
    }
    return result;
}

export function resolveToNumber(input: number | (() => number)): number {
    return typeof input === "number" ? input : input();
}