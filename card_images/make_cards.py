#obviously the best way to draw all the cards it to auto-generate TeX with python and then
#run each file separately
#and probably convert the PDF's to PNG's after that

import os

for color in ["red","green","blue"]:
	for shape in ["diamond", "oval", "squiggle"]:
		for filling in ["solid", "empty", "shaded"]:
			for number in [1,2,3]:
				tex = """
\\documentclass{standalone}

\\usepackage{tikz}
\\usetikzlibrary{patterns}

\\definecolor{setRed}{RGB}{255,10,90}
\\definecolor{setGreen}{RGB}{56,205,69}
\\definecolor{setBlue}{RGB}{112,109,255}


\\tikzset{
solid/.style={fill,line width = 6},
empty/.style={fill=white,line width = 6},
shaded/.style={pattern = horizontal lines,line width = 6},
red/.style={setRed, fill = setRed, pattern color = setRed},
green/.style={setGreen, fill = setGreen, pattern color = setGreen},
blue/.style={setBlue, fill = setBlue, pattern color = setBlue}
}

\\begin{document}

	\\begin{tikzpicture}
				"""

				diamond = """
		\\begin{scope}[xshift = %s]
			\\clip (1,0) -- (0,2) -- (-1,0) -- (0,-2) -- cycle;
			\\draw[%s,%s] (1,0) -- (0,2) -- (-1,0) -- (0,-2) -- cycle;
		\\end{scope}
					"""

				oval = """
		\\begin{scope}[xshift = %s]
			\\clip[rounded corners=28] (1,-2) -- (1,2) -- (-1,2) -- (-1,-2) -- cycle;
			\\draw[%s, %s, rounded corners=28] (1,-2) -- (1,2) -- (-1,2) -- (-1,-2) -- cycle;
		\\end{scope}
				"""

				squiggle="""
		\\begin{scope}[xshift = %s]
		\\begin{scope}[scale=4,rotate=90,yscale=-1]
			\\clip (1.04,0.15) .. controls (1.124,0.369) and (0.897,0.608) ..  (0.63,0.54)
							  .. controls (0.523,0.513) and (0.424,0.42) .. (0.27,0.53) 
							  .. controls (0.096,0.656) and (0.054,0.583) .. (0.05,0.4)
							  .. controls (0.046,0.22)  and (0.191,0.097) .. (0.36,0.12)
							  .. controls (0.592,0.152)  and (0.619,0.315) .. (0.89,0.14)
							  .. controls (0.953,0.1) and   (1.009,0.069) .. (1.04,0.15);
			\\draw[%s,%s] (1.04,0.15) .. controls (1.124,0.369) and (0.897,0.608) ..  (0.63,0.54)
							  .. controls (0.523,0.513) and (0.424,0.42) .. (0.27,0.53) 
							  .. controls (0.096,0.656) and (0.054,0.583) .. (0.05,0.4)
							  .. controls (0.046,0.22)  and (0.191,0.097) .. (0.36,0.12)
							  .. controls (0.592,0.152)  and (0.619,0.315) .. (0.89,0.14)
							  .. controls (0.953,0.1) and   (1.009,0.069) .. (1.04,0.15);
		\\end{scope}
		\\end{scope}"""
				shape_tex = ""
				for n in range(0,number):
					shift = str(7*n) + "em"
					if shape == "diamond":
						shape_tex += diamond % (shift,color, filling)
					elif shape == "oval":
						shape_tex += oval % (shift,color, filling)
					elif shape == "squiggle":
						shape_tex += squiggle % (shift, color, filling) #sqiggle
					print(shape_tex)


				endtex = """
	\\end{tikzpicture}

\\end{document}
				"""

				filename = "tex/"+str(number) + "_" + filling + "_" + color + "_" + shape
				file = open(filename+".tex","w")

				file.write(tex)
				file.write(shape_tex)
				file.write(endtex)

				file.close()


				os.system("pdflatex -output-directory tex/ "+filename)

				#requires imagemagik
				os.system("convert -density 150 "+filename+".pdf -quality 90 "+filename+".png")