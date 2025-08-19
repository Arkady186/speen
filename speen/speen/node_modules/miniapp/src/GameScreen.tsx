import React from 'react'

export function GameScreen() {
    return (
        <div style={root}>
            <div style={topBar}>
                <div style={avatar} />
                <div style={balances}>
                    <div style={balanceRow}><Coin /> <span style={{marginLeft: 6}}>W: 0</span></div>
                    <div style={balanceRow}><Coin /> <span style={{marginLeft: 6}}>B: 0</span></div>
                </div>
            </div>
            <div style={content} />
            <div style={bottomNav}>
                <div style={navBtn}>Задания</div>
                <div style={navBtn}>Банк</div>
                <div style={navBtn}>Магазин</div>
            </div>
        </div>
    )
}

function Coin(){
    return (
        <div style={{width:20,height:20,borderRadius:'50%',background:'radial-gradient(circle,#ffd86b,#f2a93b)',border:'2px solid #7a4e06'}} />
    )
}

const root: React.CSSProperties = {
    minHeight: '100dvh',
    backgroundImage: 'url(/bg-game.png)', // положите файл в public/bg-game.png
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
}

const topBar: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px'
}

const avatar: React.CSSProperties = { width: 60, height: 60, borderRadius: '50%', background: '#fff', border: '3px solid #2a5b9f', boxShadow:'0 2px 0 #0b2f68' }
const balances: React.CSSProperties = { display:'grid', gap:8 }
const balanceRow: React.CSSProperties = { display:'flex', alignItems:'center', padding:'6px 10px', background: 'linear-gradient(90deg,#2a5b9f,#184b97)', borderRadius: 12, color:'#fff', boxShadow:'inset 0 0 0 2px #8cbcff' }

const content: React.CSSProperties = { margin: '8px 10px', borderRadius: 12, boxShadow:'inset 0 0 0 3px #8cbcff', background:'rgba(0,0,0,0.05)' }

const bottomNav: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, padding:12 }
const navBtn: React.CSSProperties = { background:'#244e96', color:'#fff', borderRadius:16, padding:'14px 10px', textAlign:'center', boxShadow:'inset 0 0 0 3px #0b2f68' }


