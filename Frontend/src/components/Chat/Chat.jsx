import React, { useEffect, useState } from 'react';
import Button from '../UI/Button';
import styles from './Chat.module.css';

function Chat({ contextId, type }) {
    const userId = localStorage.getItem('userId');
    const [posts, setPosts] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const fetchPosts = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/chat/${type}/${contextId}`);
            if (res.ok) {
                setPosts(await res.json());
            }
        } catch (err) {
            console.error("Error fetching chat:", err);
        }
    };

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, 5000);
        return () => clearInterval(interval);
    }, [contextId, type]);

    const handlePost = async () => {
        if (!newMessage.trim()) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/chat/${type}/${contextId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage,
                    author_id: parseInt(userId)
                })
            });

            if (res.ok) {
                setNewMessage('');
                fetchPosts();
            } else {
                alert("Failed to post message.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.chatContainer}>
            <div className={styles.inputArea}>
                <textarea 
                    className={styles.textArea}
                    placeholder="Ask a question or share something..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <div className={styles.inlineStyle}>
                    <Button onClick={handlePost}>Post</Button>
                </div>
            </div>

            <div className={styles.postList}>
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className={styles.post}>
                        <div className={styles.postHeader}>
                            <span className={styles.author}>{post.author_name}</span>
                            <span className={styles.date}>{new Date(post.created_at).toLocaleString()}</span>
                        </div>
                        <div className={styles.content}>
                            {post.content}
                        </div>
                    </div>
                )) : (
                    <p className={styles.noteText}>No discussions yet. Be the first to post!</p>
                )}
            </div>
        </div>
    );
}

export default Chat;