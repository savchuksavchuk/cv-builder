declare const untrusted: unique symbol;

export type Untrusted<T extends string = string> = T & {
  readonly [untrusted]: true;
};

export type WrappedUntrusted = Untrusted & { readonly wrapped: true };

export function wrapUntrusted(
  kind: 'document' | 'question' | 'answer' | 'target_role',
  sourceId: string,
  text: string,
): WrappedUntrusted {
  const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<untrusted_input kind="${kind}" source_id="${sourceId}">${escaped}</untrusted_input>` as WrappedUntrusted;
}
