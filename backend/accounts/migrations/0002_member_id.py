from django.db import migrations, models


def backfill_member_ids(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for i, user in enumerate(User.objects.order_by('date_joined', 'id'), start=1):
        user.member_id = f"VB-{i:04d}"
        user.save(update_fields=['member_id'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='member_id',
            field=models.CharField(blank=True, editable=False, max_length=20, null=True),
        ),
        migrations.RunPython(backfill_member_ids, noop),
        migrations.AlterField(
            model_name='user',
            name='member_id',
            field=models.CharField(blank=True, editable=False, max_length=20, null=True, unique=True),
        ),
    ]
