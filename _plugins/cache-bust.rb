# based on https://distresssignal.org/busting-css-cache-with-jekyll-md5-hash
# https://gist.github.com/BryanSchuetz/2ee8c115096d7dd98f294362f6a667db
module Jekyll
  module CacheBust
    # Build-scoped fallback. Set once when the plugin loads (i.e. once per
    # `jekyll build`), so every page rendered in the same build gets the
    # same fallback hash — predictable and not per-request.
    BUILD_FALLBACK = Time.now.to_i.to_s

    class CacheDigester
      require 'digest/md5'
      require 'pathname'

      attr_accessor :file_name, :directory

      def initialize(file_name:, directory: nil)
        self.file_name = file_name
        self.directory = directory
      end

      def digest!
        [file_name, '?', Digest::MD5.hexdigest(file_contents)].join
      end

      private

      def directory_files_content
        target_path = File.join(directory, '**', '*')
        Dir[target_path].map{|f| File.read(f) unless File.directory?(f) }.join
      end

      def file_content
        local_file_name = file_name.slice((file_name.index('assets/')..-1))

        # Static asset present at the URL path (e.g. .png, .js, vendored .css)
        return File.read(local_file_name) if File.exist?(local_file_name)

        # Compiled CSS — main.css is generated from main.scss + the _sass tree.
        # Hash the SCSS source plus every partial so a change to _themes.scss
        # (or any sibling) busts the cache. This is the case that previously
        # silently returned empty-string MD5 (?d41d8cd…) and broke style
        # rollouts for returning visitors.
        if local_file_name.end_with?('.css')
          parts = []
          scss_path = local_file_name.sub(/\.css$/, '.scss')
          parts << File.read(scss_path) if File.exist?(scss_path)
          Dir.glob('_sass/**/*').sort.each do |f|
            parts << File.read(f) unless File.directory?(f)
          end
          return parts.join unless parts.empty?
        end

        # Fall back to the build-time hash so a missing file doesn't yield
        # a constant empty-string MD5 (which would defeat caching entirely).
        # Same value for every page in this build; changes on next build.
        Jekyll::CacheBust::BUILD_FALLBACK
      end

      def directory_content_with_source
        # Used by bust_css_cache: hash the SCSS source for this URL plus all
        # files in the _sass tree. Captures changes to imported partials so
        # editing _themes.scss (or any sibling) busts the cache for every
        # page that links the compiled .css.
        local_file_name = file_name.slice((file_name.index('assets/')..-1))
        parts = []
        if local_file_name.end_with?('.css')
          scss_path = local_file_name.sub(/\.css$/, '.scss')
          parts << File.read(scss_path) if File.exist?(scss_path)
        end
        Dir.glob(File.join(directory, '**', '*')).sort.each do |f|
          parts << File.read(f) unless File.directory?(f)
        end
        return parts.join unless parts.empty?
        Jekyll::CacheBust::BUILD_FALLBACK
      end

      def file_contents
        is_directory? ? file_content : directory_content_with_source
      end

      def is_directory?
        directory.nil?
      end
    end

    def bust_file_cache(file_name)
      CacheDigester.new(file_name: file_name, directory: nil).digest!
    end

    # For CSS that compiles from SCSS imports — hashes the SCSS source for
    # the URL plus every file in the _sass directory, so partial edits bust
    # the cache. Project root layout (no `assets/_sass`).
    def bust_css_cache(file_name)
      CacheDigester.new(file_name: file_name, directory: '_sass').digest!
    end
  end
end

Liquid::Template.register_filter(Jekyll::CacheBust)