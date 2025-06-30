import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface FormDialogProps {
  title: string;
  description: string;
  triggerText: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitText: string;
  children: React.ReactNode;
}

const FormDialog: React.FC<FormDialogProps> = ({
  title,
  description,
  triggerText,
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading,
  submitText,
  children,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground border border-primary-foreground hover:bg-primary-foreground hover:text-primary">
          <Plus className="mr-2 h-4 w-4" /> {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
              </>
            ) : (
              submitText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
