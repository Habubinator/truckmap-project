export type CreateQuestionArgs = {
  title: string;
  content: string;
  sectionId: number;
  subsectionId?: number | null;
  resolved?: boolean;
  creatorId: number;
};

export class CreateQuestionDto {
  public readonly title: string;
  public readonly content: string;
  public readonly sectionId: number;
  public readonly subsectionId?: number | undefined | null;
  public readonly creatorId: number;

  constructor(args: CreateQuestionArgs) {
    this.title = args.title;
    this.content = args.content;
    this.sectionId = +args.sectionId;
    this.subsectionId = args.subsectionId ? +args.subsectionId : undefined;
    this.creatorId = args.creatorId;
  }
}
