# Patch jekyll-imagemagick to use `magick` instead of the deprecated `convert`
# command. ImageMagick v7 removed the standalone `convert` binary; the correct
# invocation is now `magick convert` (or just `magick`).
#
# This monkey-patch overrides ImageConvert.run so the rest of the gem works
# unchanged. Safe to delete once jekyll-imagemagick ships a native fix.

require 'jekyll-imagemagick/convert'

module JekyllImagemagick
  class ImageConvert
    def self.run(input_file, output_file, flags, long_edge, resize_flags)
      Jekyll.logger.info(LOG_PREFIX, "Generating image \"#{output_file}\"")

      cmd = "magick \"#{input_file}\" #{flags} "
      if long_edge != 0
        cmd += "-resize \"#{long_edge}>\" #{resize_flags} "
      end
      cmd += "\"#{output_file}\""
      Jekyll.logger.debug(LOG_PREFIX, "Running command \"#{cmd}\"")
      run_cmd(cmd)
    end
  end
end
