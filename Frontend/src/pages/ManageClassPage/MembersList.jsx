import React from 'react';
import styles from './ManageClassPage.module.css';

function MembersList({ members, userRole, onMemberClick, onRemoveStudent }) {
    return (
        <>
            {members.map(member => {
                const isClickable = userRole === 'professor' && member.role === 'student';
                return (
                    <div
                        key={member.id}
                        className={`${styles.listItem} ${isClickable ? styles.clickableMember : styles.defaultMember}`}
                        onClick={() => isClickable && onMemberClick(member)}
                    >
                        <div className={styles.memberProfile}>
                            <div className={styles.avatar}>
                                {member.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div className={`${styles.itemTitle} ${styles.memberUsername}`}>{member.username}</div>
                                <div className={styles.itemMeta}>{member.email}</div>
                            </div>
                        </div>
                        <div className={styles.memberActionsGroup}>
                            <span className={`${styles.roleBadge} ${member.role === 'professor' ? styles.badgeProfessor : styles.badgeStudent}`}>
                                {member.role === 'professor' ? 'Professor' : 'Student'}
                            </span>

                            {userRole === 'professor' && member.role === 'student' && (
                                <button
                                    className={`${styles.iconBtn} ${styles.deleteIcon}`}
                                    onClick={(e) => { e.stopPropagation(); onRemoveStudent(member.id); }}
                                    title="Remove Student"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

export default MembersList;
