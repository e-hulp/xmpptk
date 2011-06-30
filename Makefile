BUILDDIR  = ./htdocs
SOURCEDIR = ./src

OUTFILE   = $(BUILDDIR)/helpim.js
DEPSFILE  = $(SOURCEDIR)/deps.js

all: clean deps jsjac build

build:
	@echo "building helpim";
	@./lib/closure-library/closure/bin/build/closurebuilder.py --root=lib/closure-library/ --root=$(SOURCEDIR) --namespace="helpim" --output_mode=compiled -f '--compilation_level=ADVANCED_OPTIMIZATIONS' -f '--externs=externs.js' -f '--define=goog.DEBUG=false' --compiler_jar=utils/compiler/compiler.jar > $(OUTFILE)
	@cp -r src/xmpptk/images htdocs/
	@cp -r src/xmpptk/sounds htdocs/
	@cp -r src/helpim/helpim.css htdocs/

jsjac:
	@echo "building jsjac";
	@make -C lib/jsjac;
	@cp lib/jsjac/jsjac.js $(BUILDDIR)

clean:
	@rm -f $(OUTFILE) 2> /dev/null
	@rm -f $(DEPSFILE) 2> /dev/null

deps:
	@echo "building dependencies";
	@./lib/closure-library/closure/bin/build/depswriter.py --root_with_prefix="$(SOURCEDIR) ../../" > $(DEPSFILE)
