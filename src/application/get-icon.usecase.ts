import type { MingcuteIconSet, MingcuteStyleFilter } from "../domain/icon";
import { readSvg } from "../infrastructure/data/icon-loader";
import { IconSearchRepository } from "../infrastructure/search/icon-search.repository";
import { filterIconVariants, normaliseStyle } from "./search-icons.usecase";

export interface GetIconInput {
  readonly name: string;
  readonly style?: MingcuteStyleFilter;
  readonly includeSvg?: boolean;
}

export interface GetIconResponse {
  readonly icon: MingcuteIconSet;
  svg?: Partial<Record<"line" | "fill", string>>;
}

export class GetIconUseCase {
  constructor(private readonly repository: IconSearchRepository) {}

  async execute(input: GetIconInput): Promise<GetIconResponse> {
    const icon = this.repository.getByName(input.name);
    if (!icon) {
      throw new Error(`MingCute icon "${input.name}" was not found.`);
    }

    const style = normaliseStyle(input.style);
    const filtered = filterIconVariants(icon, style);
    const response: GetIconResponse = { icon: filtered };

    if (input.includeSvg) {
      response.svg = {};
      for (const [variantStyle, variant] of Object.entries(filtered.variants)) {
        if (variant) {
          response.svg[variantStyle as "line" | "fill"] = await readSvg(variant.svgPath);
        }
      }
    }

    return response;
  }
}
