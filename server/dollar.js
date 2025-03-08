/**
 * The $1 Unistroke Recognizer (JavaScript version)
 *
 *  Jacob O. Wobbrock, Ph.D.
 *  The Information School
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  wobbrock@uw.edu
 *
 *  Andrew D. Wilson, Ph.D.
 *  Microsoft Research
 *  One Microsoft Way
 *  Redmond, WA 98052
 *  awilson@microsoft.com
 *
 *  Yang Li, Ph.D.
 *  Department of Computer Science and Engineering
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  yangli@cs.washington.edu
 *
 * The academic publication for the $1 recognizer, and what should be
 * used to cite it, is:
 *
 *     Wobbrock, J.O., Wilson, A.D. and Li, Y. (2007). Gestures without
 *     libraries, toolkits or training: A $1 recognizer for user interface
 *     prototypes. Proceedings of the ACM Symposium on User Interface
 *     Software and Technology (UIST '07). Newport, Rhode Island (October
 *     7-10, 2007). New York: ACM Press, pp. 159-168.
 *     https://dl.acm.org/citation.cfm?id=1294238
 *
 * The Protractor enhancement was separately published by Yang Li and programmed
 * here by Jacob O. Wobbrock:
 *
 *     Li, Y. (2010). Protractor: A fast and accurate gesture
 *     recognizer. Proceedings of the ACM Conference on Human
 *     Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *     (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *     https://dl.acm.org/citation.cfm?id=1753654
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved. Last updated July 14, 2018.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
 * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

export default DollarRecognizer;

//
// Point class
//
function Point(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Unistroke class: a unistroke template
//
function Unistroke(name, points) // constructor
{
	this.Name = name;
	this.Points = Resample(points, NumPoints);
	var radians = IndicativeAngle(this.Points);
	this.Points = RotateBy(this.Points, -radians);
	this.Points = ScaleTo(this.Points, SquareSize);
	this.Points = TranslateTo(this.Points, Origin);
	this.Vector = Vectorize(this.Points); // for Protractor
}
//
// Result class
//
function Result(name, score, ms) // constructor
{
	this.Name = name;
	this.Score = score;
	this.Time = ms;
}
//
// DollarRecognizer constants
//
const NumUnistrokes = 4;
const NumPoints = 64;
const SquareSize = 250.0;
const Origin = new Point(0,0);
const Diagonal = Math.sqrt(SquareSize * SquareSize + SquareSize * SquareSize);
const HalfDiagonal = 0.5 * Diagonal;
const AngleRange = Deg2Rad(45.0);
const AnglePrecision = Deg2Rad(2.0);
const Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
//
// DollarRecognizer class
//
function DollarRecognizer() // constructor
{
	//
	// one built-in unistroke per gesture type
	//
	this.Unistrokes = new Array(NumUnistrokes);
	this.Unistrokes[0] = new Unistroke("triangle", new Array(new Point(4.52, 8.64),new Point(2.59, 7.29),new Point(0.53, 9.44),new Point(2.06, 8.4),new Point(1.54, 8.71),new Point(1.42, 8.81),new Point(2.84, 8.81),new Point(2.29, 9.01),new Point(1.12, 9.12),new Point(1.32, 8.31),new Point(-1.13, 5.78),new Point(-1.46, 5.86),new Point(-1.42, 7.21),new Point(-0.95, 6.05),new Point(0.04, 8.49),new Point(2.3, 11.73),new Point(1.88, 9.74),new Point(2.06, 13.65),new Point(7.22, 9.44),new Point(6.05, 11.11),new Point(0.64, 14.25),new Point(3.63, 10.37),new Point(3.89, 9.23),new Point(4.71, 9.6),new Point(9.86, 6.79),new Point(6.08, 9.91),new Point(1.99, 9.77),new Point(-1.47, 11.2),new Point(-0.16, 7.64),new Point(-6.27, 6.91),new Point(-8.13, 5.27),new Point(-8.32, 6.94),new Point(-5.99, 9.34),new Point(-3.25, 10.06),new Point(-2.35, 11.04),new Point(-1.64, 11.58),new Point(-5.63, 14.21),new Point(-2.63, 11.88),new Point(-1.7, 11.29),new Point(-1.29, 11.63),new Point(0.72, 8.6),new Point(0.64, 5.71),new Point(4.36, 3.28),new Point(1.68, 5.34),new Point(3.15, 5.6)));
	this.Unistrokes[1] = new Unistroke("x", new Array(new Point(2.92, 4.75),new Point(4.7, 4.54),new Point(3.95, 5.26),new Point(3.98, 5.27),new Point(3.55, 5.16),new Point(3.63, 5.54),new Point(3.81, 3.47),new Point(5.6, 3.19),new Point(1.8, 1.67),new Point(8.21, -1.7),new Point(4.22, 0.13),new Point(4.31, 0.52),new Point(3.95, 1.59),new Point(1.87, 0.66),new Point(2.54, 0.23),new Point(-2.91, 2.31),new Point(1.11, -0.49),new Point(-1.5, 1.87),new Point(1.27, 0.12),new Point(0.32, 2.19),new Point(4.04, 0.9),new Point(1.2, 2.93),new Point(6.31, -0.43),new Point(-1.49, 3.44),new Point(6.71, -1.2),new Point(-4.76, 3.23),new Point(5.3, -4.16),new Point(-1.86, 2.99),new Point(3.27, 0.98),new Point(-0.14, 5.4),new Point(0.12, 5.73),new Point(-0.24, 5.29),new Point(-1.34, 5.38),new Point(0.49, 2.06),new Point(-3.4, 4.14),new Point(1.38, 1.19),new Point(-2.46, 0.66),new Point(-0.3, 0.44),new Point(2.7, 1.06),new Point(3.22, 0.24),new Point(5.17, 1.61),new Point(6.6, 0.88),new Point(5.83, 3.01),new Point(7.97, 0.56),new Point(5.24, 1.44),new Point(4.15, 0)));
	this.Unistrokes[2] = new Unistroke("rectangle", new Array(new Point(1.81, 5.8),new Point(1.15, 5.01),new Point(1.8, 4.63),new Point(1.14, 4.63),new Point(1.72, 3.93),new Point(1.99, 2.85),new Point(0.6, 0.65),new Point(1.95, 1.94),new Point(-0.05, -0.37),new Point(2.18, 1.45),new Point(4.37, 0.66),new Point(4.28, -1.11),new Point(3.91, -0.26),new Point(4.66, -0.37),new Point(4.19, 1.18),new Point(2.45, 1.32),new Point(4.56, 0.01),new Point(8.31, -1.33),new Point(8.5, -1.76),new Point(8.88, -3.01),new Point(6.01, -0.96),new Point(4.63, -1.52),new Point(1.47, -1.06),new Point(-0.92, -1.85),new Point(-6.22, -4.12),new Point(-4.57, -3.82),new Point(-3.91, -2.78),new Point(-2.07, -0.27),new Point(-0.32, -0.39),new Point(1.81, 0.77),new Point(2.33, -0.72),new Point(1.84, 0.24),new Point(1.1, 0.53),new Point(0.29, 0.38),new Point(-1.23, 0.3),new Point(0.33, -0.57),new Point(-0.32, 2.77),new Point(-2.08, 4.44),new Point(-3.03, 3.92),new Point(-3.68, 3.44),new Point(-4.68, 4.85),new Point(-3.35, 2.39),new Point(-2.05, 2.23),new Point(0.3, 2.52),new Point(1.26, 2.99),new Point(4.97, 1.8),new Point(6.5, 2.09),new Point(6.63, 2.54),new Point(3.71, 2.92)));
	this.Unistrokes[3] = new Unistroke("circle", new Array(new Point(0.64, 3.98),new Point(0.85, 2.27),new Point(-0.5, 2.92),new Point(-0.36, 2.27),new Point(-0.95, 2.13),new Point(0.12, 1.48),new Point(1.14, 4.23),new Point(-0.38, 2.27),new Point(2.51, 2.16),new Point(2.91, 1.18),new Point(3.93, 0.04),new Point(5.1, -0.34),new Point(4.98, -1.39),new Point(4.33, -0.88),new Point(5.03, -1.97),new Point(5.06, -1.27),new Point(3.92, -0.55),new Point(3.45, -1.76),new Point(0.85, 0.06),new Point(1.25, -1.24),new Point(-1.7, 0.78),new Point(-1.12, -0.93),new Point(-1.86, -1.04),new Point(-2.98, -1.04),new Point(-1.45, -1.25),new Point(-2.16, -0.25),new Point(-0.17, -1.15),new Point(-0.21, 1.01),new Point(2.69, -0.51),new Point(0.25, 3.34),new Point(3.66, 1.08),new Point(2.07, 3.62),new Point(6.13, 1.64),new Point(5.51, 3.5)));
	//
	// The $1 Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
	//
	this.Recognize = function(points, useProtractor)
	{
		var t0 = Date.now();
		var candidate = new Unistroke("", points);

		var u = -1;
		var b = +Infinity;
		for (var i = 0; i < this.Unistrokes.length; i++) // for each unistroke template
		{
			var d = -1;

			if (useProtractor) {
				console.log(candidate.Vector);
				d = OptimalCosineDistance(this.Unistrokes[i].Vector, candidate.Vector); // Protractor
				//console.log(d);
			}
			else {
				d = DistanceAtBestAngle(candidate.Points, this.Unistrokes[i], -AngleRange, +AngleRange, AnglePrecision); // Golden Section Search (original $1)
				//console.log(d);
			}
			console.log(d);
			console.log(b);
			console.log(d < b);
			if (d < b) {
				b = d; // best (least) distance
				u = i; // unistroke index
			}
		}
		var t1 = Date.now();
		return (u == -1) ? new Result("No match.", 0.0, t1-t0) : new Result(this.Unistrokes[u].Name, useProtractor ? (1.0 - b) : (1.0 - b / HalfDiagonal), t1-t0);
	}
	this.AddGesture = function(name, points)
	{
		this.Unistrokes[this.Unistrokes.length] = new Unistroke(name, points); // append new unistroke
		var num = 0;
		for (var i = 0; i < this.Unistrokes.length; i++) {
			if (this.Unistrokes[i].Name == name)
				num++;
		}
		return num;
	}
	this.DeleteUserGestures = function()
	{
		this.Unistrokes.length = NumUnistrokes; // clear any beyond the original set
		return NumUnistrokes;
	}
}
//
// Private helper functions from here on down
//
function Resample(points, n)
{
	var I = PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = Distance(points[i-1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i-1].X + ((I - D) / d) * (points[i].X - points[i-1].X);
			var qy = points[i-1].Y + ((I - D) / d) * (points[i].Y - points[i-1].Y);
			var q = new Point(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	if (newpoints.length == n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new Point(points[points.length - 1].X, points[points.length - 1].Y);
	return newpoints;
}
function IndicativeAngle(points)
{
	var c = Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function RotateBy(points, radians) // rotates points around centroid
{
	var c = Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function ScaleTo(points, size) // non-uniform scale; assumes 2D gestures (i.e., no lines)
{
	var B = BoundingBox(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X * (size / B.Width);
		var qy = points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function TranslateTo(points, pt) // translates points' centroid
{
	var c = Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function Vectorize(points) // for Protractor
{
	var sum = 0.0;
	var vector = new Array();
	for (var i = 0; i < points.length; i++) {
		vector[vector.length] = points[i].X;
		vector[vector.length] = points[i].Y;
		sum += points[i].X * points[i].X + points[i].Y * points[i].Y;
	}
	var magnitude = Math.sqrt(sum);
	for (var i = 0; i < vector.length; i++)
		vector[i] /= magnitude;
	return vector;
}
function OptimalCosineDistance(v1, v2) // for Protractor
{
	var a = 0.0;
	var b = 0.0;
	for (var i = 0; i < v1.length; i += 2) {
		a += v1[i] * v2[i] + v1[i+1] * v2[i+1];
		b += v1[i] * v2[i+1] - v1[i+1] * v2[i];
	}
	var angle = Math.atan(b / a);
	return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
}
function DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = Phi * a + (1.0 - Phi) * b;
	var f1 = DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - Phi) * a + Phi * b;
	var f2 = DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2) {
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = Phi * a + (1.0 - Phi) * b;
			f1 = DistanceAtAngle(points, T, x1);
		} else {
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - Phi) * a + Phi * b;
			f2 = DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}
function DistanceAtAngle(points, T, radians)
{
	var newpoints = RotateBy(points, radians);
	return PathDistance(newpoints, T.Points);
}
function Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new Point(x, y);
}
function BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function PathDistance(pts1, pts2)
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function PathLength(points)
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += Distance(points[i - 1], points[i]);
	return d;
}
function Distance(p1, p2)
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function Deg2Rad(d) { return (d * Math.PI / 180.0); }
