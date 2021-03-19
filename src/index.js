import './style'
import { useState, useEffect } from 'preact/hooks'
import { xml2js } from 'xml-js'

class Buffer {
	constructor(text) {
		this.text = "";
		this.addLine(text)
	}
	addLine(line) {
		this.text = `${this.text}${line}\n`
	}
	string() {
		return this.text
	}
}

function escapeQuote(text) {
	return text.replaceAll("\"", "\\\"")
}

function jsToDot(js) {
	const rawIssues = js.rss.channel.item

	const issues = rawIssues.map(issue => {
		const id = issue.key._text
		const summary = issue.summary._text;
		const links = issue.issuelinks?.issuelinktype;
		const outward = asLink(links?.outwardlinks);
		const status = issue.status._text
		const isClosed = status == 'Closed'

		return {
			summary,
			id,
			outward,
			isClosed
		}
	})

	const dot = new Buffer("digraph graphname{ bgcolor=lightblue")

	issues.forEach(({ summary, id, isClosed }) => {
		const extra = isClosed ? " fillcolor=aquamarine1 style=filled" : " fillcolor=white style=filled"
		dot.addLine(`  "${id}"[label="${escapeQuote(summary)}" shape=rectangle ${extra}]`)
	})

	dot.addLine("")

	issues.forEach(({ id, outward }) => {
		if (outward?.target) {
			dot.addLine(`  "${id}"->"${outward.target}" [label="${outward.description}"]`)
		}
	})

	dot.addLine("}")
	return dot.string()
}

function asLink(x) {
	if (x == null || x == undefined) {
		return null
	}
	return {
		description: x._attributes.description,
		target: (x.issuelink?.issuekey || {})._text
	}
}

function updateSvgWithDot(dot) {
	console.log({ dot })

	const margin = 20;
	const height = window.innerHeight - margin;

	d3.select("#graph").graphviz()
		.height(height)
		.fit(true)
		.renderDot(dot);
}

function updateSvgWithXml(xml) {
	console.log({ xml })
	try {
		const js = xml2js(xml, { compact: true, spaces: 4 })
		const dot = jsToDot(js)
		updateSvgWithDot(dot)
	} catch (e) {
		console.log(e)
	}
}

export default function App() {
	const [xml, setXml] = useState("<xml></xml>")

	useEffect(() => {
		updateSvgWithXml(xml)
	}, [xml]);

	const onChange = (event) => {
		setXml(event.target.value)
	};

	return (
		<div className="parent">
			<form id="input" className="section" contenteditable>
				<textarea value={xml} onInput={onChange} spellcheck="false"></textarea>
			</form>
			<div id="graph" className="section" contenteditable />
		</div>
	);
}
