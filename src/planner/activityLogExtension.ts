/** Extension / user metadata for resolving activity log avatars and names. */
export interface ActivityLogExtension {
  id?: string | number;
  name?: string;
  extension_number?: string;
  user?: { name?: string };
}
