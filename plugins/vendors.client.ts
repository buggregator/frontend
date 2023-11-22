import SfdumpWrap from "~/src/shared/lib/vendor/dumper";

export default defineNuxtPlugin(() => {
  const sfdump = SfdumpWrap(window.document)

  return {
    provide: {
      vendors: {
        sfdump
      }
    }
  }
})
