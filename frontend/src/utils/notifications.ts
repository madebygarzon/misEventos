import Swal from "sweetalert2";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
});

export async function notifySuccess(message: string) {
  await toast.fire({
    icon: "success",
    title: message
  });
}

export async function notifyError(message: string) {
  await toast.fire({
    icon: "error",
    title: message
  });
}

export async function notifyInfo(message: string) {
  await toast.fire({
    icon: "info",
    title: message
  });
}

export async function confirmDialog(params: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "question" | "info" | "error" | "success";
}) {
  const result = await Swal.fire({
    title: params.title,
    text: params.text,
    icon: params.icon || "warning",
    showCancelButton: true,
    confirmButtonText: params.confirmButtonText || "Confirmar",
    cancelButtonText: params.cancelButtonText || "Cancelar",
    reverseButtons: true
  });
  return result.isConfirmed;
}
