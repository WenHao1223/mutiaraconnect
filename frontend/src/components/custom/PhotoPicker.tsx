import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoPickerProps {
    photos: File[];
    onChange: (photos: File[]) => void;
}

/**
 * One "Upload photo" button with removable thumbnails. On phones the system picker already offers
 * the camera as well as the photo library. Frontend only for now: the files stay in the form and
 * are not uploaded anywhere.
 */
export default function PhotoPicker({ photos, onChange }: PhotoPickerProps) {
    const fileInput = useRef<HTMLInputElement>(null);

    // Preview URLs for the thumbnails, released when the photos change or the form goes away.
    const previews = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos]);
    useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

    function add(files: FileList | null) {
        const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
        if (images.length > 0) onChange([...photos, ...images]);
    }

    return (
        <div className="mt-1.5 space-y-2">
            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                <ImagePlus className="size-4" aria-hidden />
                Upload photo
            </Button>
            <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => {
                    add(event.target.files);
                    event.target.value = "";
                }}
            />

            {photos.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {photos.map((photo, index) => (
                        <li
                            key={previews[index]}
                            className="relative size-20 overflow-hidden rounded-md border"
                        >
                            <img
                                src={previews[index]}
                                alt={photo.name}
                                className="size-full object-cover"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute top-1 right-1 size-6"
                                aria-label={`Remove ${photo.name}`}
                                onClick={() => onChange(photos.filter((_, i) => i !== index))}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
