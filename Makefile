BUILDDIR  = ./htdocs

OUTFILE   = $(BUILDDIR)/helpim.js
DEPSFILE  = $(BUILDDIR)/deps.js

all: clean deps jsjac build

build:
	@echo "building helpim";
	@./lib/closure-library/closure/bin/build/closurebuilder.py --root=lib/closure-library/ --root=src/ --namespace="helpim.start" --output_mode=compiled -f '--compilation_level=ADVANCED_OPTIMIZATIONS' -f '--externs=jsjac_externs.js' --compiler_jar=utils/compiler/compiler.jar > $(OUTFILE)

jsjac:
	@echo "building jsjac";
	@make -C lib/jsjac;
	@cp lib/jsjac/jsjac.js $(BUILDDIR)

clean:
	@rm -f $(OUTFILE) 2> /dev/null
	@rm -f $(DEPSFILE) 2> /dev/null

deps:
	@echo "building dependencies";
	@./lib/closure-library/closure/bin/build/depswriter.py --root_with_prefix="./src ../../../../src/" > $(DEPSFILE)
