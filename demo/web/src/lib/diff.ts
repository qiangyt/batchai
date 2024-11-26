export class FileDiff {

    constructor(
        readonly path: string,
        readonly oldContent: string,
        readonly newContent: string) { }
}