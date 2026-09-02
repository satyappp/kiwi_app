"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Sorting-specific back control.
 * Always confirms that unsaved input will be discarded; choosing "はい"
 * replaces the current history entry with home so the abandoned form is not
 * reopened by the browser's back action.
 */
export function SortingBackButton() {
  const router = useRouter();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="ホームに戻る"
            className="grid size-10 place-items-center rounded-full text-kiwi-ink active:bg-black/5"
          />
        }
      >
        <ChevronLeft className="size-6" strokeWidth={2.4} />
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="gap-5 rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-kiwi-ink">
            ホームに戻りますか？
          </DialogTitle>
          <DialogDescription className="leading-6">
            現在の入力内容は保存されません。ホームに戻ってもよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl font-bold"
              />
            }
          >
            いいえ
          </DialogClose>
          <Button
            type="button"
            onClick={() => router.replace("/")}
            className="h-11 rounded-xl font-bold"
          >
            はい
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
