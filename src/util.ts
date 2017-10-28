export const randomChoice = <T>(choices: T[]): T => {
    const i = Math.floor(Math.random() * choices.length);
    return choices[i];
}
